from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
import os
import base64
import subprocess
import tempfile
from pathlib import Path

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shaders.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Shader(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.Text, nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    shaders = Shader.query.all()
    return render_template('index.html', shaders=shaders)

@app.route('/static/shaders/<path:filename>')
def serve_shader(filename):
    return send_from_directory('static/shaders', filename)

@app.route('/api/shaders', methods=['GET'])
def get_shaders():
    shaders = Shader.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'code': s.code} for s in shaders])

@app.route('/api/shaders', methods=['POST'])
def save_shader():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'code' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        shader = Shader(name=data['name'], code=data['code'])
        db.session.add(shader)
        db.session.commit()
        return jsonify({'id': shader.id, 'name': shader.name, 'code': shader.code})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shaders/<int:shader_id>', methods=['GET'])
def get_shader(shader_id):
    try:
        shader = Shader.query.get_or_404(shader_id)
        return jsonify({'id': shader.id, 'name': shader.name, 'code': shader.code})
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/export', methods=['POST'])
def export_video():
    try:
        data = request.get_json()
        frames = data.get('frames', [])
        fps = data.get('fps', 30)
        
        if not frames:
            return jsonify({'error': 'No frames provided'}), 400

        # Create temporary directory for frames
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save frames as PNG files
            for i, frame_data in enumerate(frames):
                frame_path = Path(temp_dir) / f'frame_{i:04d}.png'
                with open(frame_path, 'wb') as f:
                    f.write(base64.b64decode(frame_data))

            # Output video path
            output_path = Path(temp_dir) / 'output.mp4'

            # Use ffmpeg to create video
            cmd = [
                'ffmpeg',
                '-framerate', str(fps),
                '-i', str(Path(temp_dir) / 'frame_%04d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-y',  # Overwrite output file if it exists
                str(output_path)
            ]

            subprocess.run(cmd, check=True)

            # Send the video file
            return send_file(
                output_path,
                mimetype='video/mp4',
                as_attachment=True,
                download_name=f'shader_{int(output_path.stat().st_mtime)}.mp4'
            )

    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'FFmpeg error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
