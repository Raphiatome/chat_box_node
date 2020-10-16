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

/**
 * Cette fonction permet de renvoyer un tableau avec les pseudos formaté en minuscule
 * @param {Array} users_tab 
 */
function getNamesOf(users_tab)
{
    let tab = new Array();
    for(let i of users_tab) tab.push(i[0].toLowerCase());

    return tab;
}



let users = new Array(); 
let is_writting = new Array();
let message_log = new Array();

io.on('connection', (socket) => {
    socket.on('new_user', usr => {
        if(!getNamesOf(users).includes(usr.toLowerCase()))
        {
            users.push([usr, socket.id]);
            io.emit('give_log', message_log);
            io.emit('give_user', users);
            io.emit('new_message', 'Console', `${usr} s'est connecté !`, 'general');
            socket.emit('user_connected', usr, socket.id);
        } else {
            socket.emit('err', 'Ce pseudo existe déjà !')
        }
        
    });

    socket.on('private_msg', (sender, receiver) => {
        users.forEach(user => {
            if(user[0] == receiver)
            {
                io.to(user[1]).emit('private', sender);
                socket.emit('private', receiver);
            }
        });
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
        console.log(channel)
        io.emit('new_message', usr, msg, channel);
        if(message_log.length == 20)
        {
            message_log.splice(0, 1);
            message_log.push([usr, msg])
        } else message_log.push([usr, msg]);
    });

    socket.on('disconnect', () => {
        for (user of users) {
            if(user[1] == socket.id){
                let name = user[0];
                let index = is_writting.indexOf(user[0])
                is_writting.splice(index, 1);
                index = users.indexOf(user);
                users.splice(index, 1);
                io.emit('new_message', 'Console', `${name} s'est déconnecté !`);
            }
        }
        io.emit('give_user', users);
        io.emit('user_writting', is_writting)
    });

});


