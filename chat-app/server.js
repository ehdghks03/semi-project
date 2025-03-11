const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// 채팅방 목록과 채팅 내역 저장
let rooms = {};
let chatHistory = {}; // 채팅 내역 저장

io.on('connection', (socket) => {
    console.log('사용자 연결됨:', socket.id);

    socket.on('join_room', ({ room, nickname }) => {
        socket.join(room);

        if (!rooms[room]) {
            rooms[room] = new Set();
            chatHistory[room] = []; // 새 채팅방 생성 시 초기화
        }
        rooms[room].add(nickname);

        console.log(`${nickname}(${socket.id})가 ${room} 방에 입장`);
        io.to(room).emit('receive_message', { nickname: '알림', message: `${nickname}님이 입장하셨습니다.` });

        // 기존 채팅 내역 보내기
        socket.emit('chat_history', chatHistory[room]);

        io.emit('room_list', Object.keys(rooms)); // 모든 사용자에게 채팅방 목록 업데이트
    });

    socket.on('send_message', (data) => {
        console.log(`메시지 받음 [${data.room}]:`, data);

        // 채팅 내역 저장
        if (chatHistory[data.room]) {
            chatHistory[data.room].push({ nickname: data.nickname, message: data.message });
        }

        io.to(data.room).emit('receive_message', {
            nickname: data.nickname,
            message: data.message,
        });
    });

    socket.on('leave_room', ({ room, nickname }) => {
        socket.leave(room);

        if (rooms[room]) {
            rooms[room].delete(nickname);
            if (rooms[room].size === 0) {
                delete rooms[room]; // 마지막 사용자가 나가면 채팅방 삭제
                delete chatHistory[room]; // 해당 채팅 내역도 삭제
            }
        }

        io.to(room).emit('receive_message', { nickname: '알림', message: `${nickname}님이 채팅방에서 나갔습니다.` });

        io.emit('room_list', Object.keys(rooms)); // 채팅방 목록 업데이트
    });

    socket.on('get_rooms', () => {
        socket.emit('room_list', Object.keys(rooms));
    });

    socket.on('disconnect', () => {
        console.log('사용자 연결 해제됨:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('서버 실행 중: http://localhost:3001');
});
