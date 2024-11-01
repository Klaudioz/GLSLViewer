from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

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

@app.route('/api/shaders', methods=['GET'])
def get_shaders():
    shaders = Shader.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'code': s.code} for s in shaders])

@app.route('/api/shaders', methods=['POST'])
def save_shader():
    data = request.get_json()
    shader = Shader(name=data['name'], code=data['code'])
    db.session.add(shader)
    db.session.commit()
    return jsonify({'id': shader.id, 'name': shader.name, 'code': shader.code})

@app.route('/api/shaders/<int:shader_id>', methods=['GET'])
def get_shader(shader_id):
    shader = Shader.query.get_or_404(shader_id)
    return jsonify({'id': shader.id, 'name': shader.name, 'code': shader.code})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
