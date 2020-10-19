// PARAMETRES DU SERVEUR
const app = require('express')();
const express = require('express')
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const { userInfo } = require('os');
const { stat } = require('fs');
const { exit, send } = require('process');
const io = require('socket.io')(http);
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => { res.sendFile(__dirname + '/public/index.html'); });
http.listen(port, () => { console.log(`Application FuturChat lancé sur http://localhost:${port}`); });
//------------------------


function get_id_by_name(name)
{
    for (const user of users) {
        if(user[0] == name) return user[1];
    };
    return false
}

let users = new Array(); 
let is_writting = new Array();
let message_log = new Array();
let private_log = new Array();

io.on('connection', (socket) => {
    socket.on('new_user', usr => {
        if(get_id_by_name(usr) == false)
        {
            users.push([usr, socket.id]);
            socket.emit('give_log', message_log, 'general');
            io.emit('give_user', users);
            io.emit('new_message', 'Console', `${usr} s'est connecté !`, 'general');
            socket.emit('user_connected', usr, socket.id);
        } else {
            socket.emit('err', 'Ce pseudo existe déjà !')
        }
    });


    socket.on('write_event', (pseudo, etat) => {
        if(etat == 1) is_writting.push(pseudo);
        else
        {
            let index = is_writting.indexOf(pseudo);
            is_writting.splice(index, 1);
        }
        io.emit('user_writting', is_writting);
    });

    
    socket.on('new_message', (usr, msg, channel) => {
        let receiverId = get_id_by_name(channel);

        if(channel == 'general')
        {
            io.emit('new_message', usr, msg, 'general');
            if(message_log.length == 20) message_log.splice(0, 1);
            message_log.push([usr, msg])
        } else {
            io.to(receiverId).emit('new_message', usr, msg, usr);
            socket.emit('new_message', usr, msg, channel);
            for (const conv of private_log) {
                if(conv.includes(get_id_by_name(usr)) && conv.includes(get_id_by_name(channel)))
                {
                    if(private_log.length == 20) private_log.splice(0, 1);
                    conv[2].push([usr, msg]); 
                    
                } 
            }
        }

        
    });

    socket.on('private_message', (sender, receiver) =>{
        let receiverId = get_id_by_name(receiver);
        let senderId = get_id_by_name(sender);
        io.to(receiverId).emit('new_private', sender, `<div class='text_container ${sender} hidden'><span class='start_private'>Coversation privée avec ${sender}</span></div>`, 'receiver');
        socket.emit('new_private', receiver, `<div class='text_container ${receiver} hidden'><span class='start_private'>Conversation privée avec ${receiver}</span></div>`, 'sender'); 
        private_log.push([senderId, receiverId, []]);
    }); 

    socket.on('disconnect', () => {
        for (user of users) {
            if(user[1] == socket.id){
                let name = user[0];
                let index = is_writting.indexOf(user[0])
                is_writting.splice(index, 1);
                index = users.indexOf(user);
                users.splice(index, 1);
                io.emit('new_message', 'Console', `${name} s'est déconnecté !`, 'general');
            }
        }
        io.emit('give_user', users);
        io.emit('user_writting', is_writting)
    });

});


