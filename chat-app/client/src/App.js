import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// 백엔드 서버와 연결
const socket = io('http://localhost:3001');

function App() {
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [room, setRoom] = useState('');
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [joined, setJoined] = useState(false);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        socket.on('receive_message', (data) => {
            setChat((prevChat) => [...prevChat, `${data.nickname}: ${data.message}`]);
        });

        socket.on('chat_history', (history) => {
            setChat(history.map((msg) => `${msg.nickname}: ${msg.message}`)); // 이전 채팅 내역 표시
        });

        socket.on('room_list', (roomList) => {
            setRooms(roomList);
        });

        return () => {
            socket.off('receive_message');
            socket.off('chat_history');
            socket.off('room_list');
        };
    }, []);

    useEffect(() => {
        socket.emit('get_rooms');
    }, [joined]);

    const joinRoom = (roomName) => {
        if (nickname.trim() && roomName.trim()) {
            setRoom(roomName);
            socket.emit('join_room', { room: roomName, nickname });
            setChat([]);
            setJoined(true);
        }
    };

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit('send_message', { room, nickname, message });
            setMessage('');
        }
    };
    // 알림 추가
    const leaveRoom = () => {
        socket.emit('leave_room', { room, nickname });
        setTimeout(() => {
            alert('채팅방에서 나왔습니다.');
            setRoom('');
            setJoined(false);
            setChat([]);
        }, 500);
    };

    return (
        <div className="chat-container">
            <h2>실시간 채팅</h2>
            {!joined ? (
                <div>
                    <input
                        type="text"
                        placeholder="닉네임 입력"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />
                    <h3>채팅방 목록</h3>
                    <ul>
                        {rooms.length > 0 ? (
                            rooms.map((roomName, index) => (
                                <li key={index}>
                                    <button onClick={() => joinRoom(roomName)}>{roomName}</button>
                                </li>
                            ))
                        ) : (
                            <p>현재 활성화된 채팅방이 없습니다.</p>
                        )}
                    </ul>
                    <input
                        type="text"
                        placeholder="새로운 채팅방 이름 입력"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    />
                    <button onClick={() => joinRoom(room)}>새 채팅방 만들기</button>
                </div>
            ) : (
                <div>
                    <h3>{room} 방</h3>
                    <button className="back-btn" onClick={() => setJoined(false)}>
                        뒤로가기
                    </button>
                    <button className="leave-btn" onClick={leaveRoom}>
                        채팅방 나가기
                    </button>
                    <div className="chat-box">
                        {chat.map((msg, index) => (
                            <p key={index} className="message">
                                {msg}
                            </p>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                    />
                    <button onClick={sendMessage}>전송</button>
                </div>
            )}
        </div>
    );
}

export default App;
