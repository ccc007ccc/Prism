# app.py

import os
import logging
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

# 配置日志记录
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# 从环境变量读取配置，提供开发时的默认值
SECRET = os.getenv('SECRET_KEY', 'dev_secret_key_should_be_changed')
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000)) 

app.config['SECRET_KEY'] = SECRET
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# --- 状态管理 ---
cameras = {}
viewing = {}

# --- HTTP 路由 ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/camera')
def camera_page():
    return render_template('camera.html')

@app.route('/viewer')
def viewer_page():
    return render_template('viewer.html')

# --- Socket.IO 事件处理 ---
@socketio.on('connect')
def handle_connect():
    sid = request.sid
    logging.info(f"客户端已连接: {sid}")
    join_room(sid)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    logging.info(f"客户端已断开: {sid}")
    
    if sid in cameras:
        del cameras[sid]
        emit('camera_disconnected', {'sid': sid}, broadcast=True)
        logging.info(f"摄像头 {sid} 已下线。剩余摄像头: {len(cameras)}")
    
    if sid in viewing:
        camera_sid = viewing[sid]
        if camera_sid in cameras:
             emit('viewer_left', {'sid': sid}, room=camera_sid)
             logging.info(f"通知摄像头 {camera_sid}，查看者 {sid} 已离开。")
        del viewing[sid]

@socketio.on('register_camera')
def register_camera():
    sid = request.sid
    if sid not in cameras:
        cameras[sid] = {}
        logging.info(f"新摄像头注册: {sid}。当前摄像头列表: {list(cameras.keys())}")
        emit('new_camera', {'sid': sid}, broadcast=True)

@socketio.on('get_camera_list')
def get_camera_list():
    sid = request.sid
    logging.info(f"客户端 {sid} 请求摄像头列表。")
    emit('camera_list', {'sids': list(cameras.keys())}, room=sid)

# --- WebRTC 信令转发逻辑 ---
@socketio.on('offer')
def handle_offer(data):
    target_sid = data.get('target')
    if target_sid:
        logging.info(f"转发 Offer: from {request.sid} to {target_sid}")
        emit('offer', {'from': request.sid, 'sdp': data.get('sdp')}, room=target_sid)

@socketio.on('answer')
def handle_answer(data):
    target_sid = data.get('target')
    if target_sid:
        logging.info(f"转发 Answer: from {request.sid} to {target_sid}")
        viewing[target_sid] = request.sid
        emit('answer', {'from': request.sid, 'sdp': data.get('sdp')}, room=target_sid)

@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    target_sid = data.get('target')
    if target_sid:
        emit('ice_candidate', {'from': request.sid, 'candidate': data.get('candidate')}, room=target_sid)

@socketio.on('request_quality_change')
def handle_quality_change(data):
    target_sid = data.get('target')
    settings = data.get('settings')
    viewer_sid = request.sid
    
    if target_sid in cameras:
        logging.info(f"转发画质变更请求: from {viewer_sid} to {target_sid}, Settings: {settings}")
        emit('apply_quality_change', {'from': viewer_sid, 'settings': settings}, room=target_sid)

if __name__ == '__main__':
    logging.info(f"信令服务器正在启动，监听地址 {HOST}:{PORT}")
    socketio.run(app, host=HOST, port=PORT)