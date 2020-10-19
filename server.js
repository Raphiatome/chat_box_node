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
 * Retourne l'id d'un utilisateur selon son nom
 * @param {String} name 
 */
function get_id_by_name(name)
{
    for (const user of users) {
        if(user[0] == name) return user[1];
    };
    return false
}

//stockage des utilisateurs connectés
let users = new Array(); 

//stoockage des utilisateurs qui sont en train d'écrire
let is_writting = new Array();

// stockage des logs publics
let message_log = new Array();

//stockage des logs privés
let private_log = new Array();

//lorsqu'un utilisateur ouvre la page
io.on('connection', (socket) => {
    //lorsqu'un utilisateur se connecte avec un pseudo
    socket.on('new_user', usr => {
        //si l'utilisateur n'existe pas :
        if(get_id_by_name(usr) == false)
        {
            //ajout de l'utilisateur dans le tableau users
            users.push([usr, socket.id]);
            //envoi des logs à l'utilisateur
            socket.emit('give_log', message_log, 'general');
            //envoi des utilisateurs connectés
            io.emit('give_user', users);
            //emission d'un message general qui annonce la connexion de l'utilisateur
            io.emit('new_message', 'Console', `${usr} s'est connecté !`, 'general');
            //validateion de connexion
            socket.emit('user_connected', usr, socket.id);
        } else {
            //si l'utilisateur existe : envoi d'une erreur
            socket.emit('err', 'Ce pseudo existe déjà !')
        }
    });


    //lorsqu'un utilisateur écris dans l'input
    socket.on('write_event', (pseudo, etat) => {
        //si il écrit, on l'ajoute au tableau is_writting
        if(etat == 1) is_writting.push(pseudo);
        //si il n'écrit plus
        else
        {
            //selection de l'index de l'user voulu dans is_writting
            let index = is_writting.indexOf(pseudo);
            //supression de l'utilisateur
            is_writting.splice(index, 1);
        }
        //envoi des utilisateurs qui écrivent à tout le monde
        io.emit('user_writting', is_writting);
    });

    //lorsqu'un user envoie un message
    socket.on('new_message', (usr, msg, channel) => {
        //si le message est destiné au canal général
        if(channel == 'general')
        {
            //envoi du message en précisant le channel general
            io.emit('new_message', usr, msg, 'general');
            //si les logs contiennent 20 messsages, on supprime le premier
            if(message_log.length == 20) message_log.splice(0, 1);
            //ajout du message aux logs
            message_log.push([usr, msg])

          //si c'est un message privé  
        } else {
            //on recupere le socket id du destinataire
            let receiverId = get_id_by_name(channel);
            //envoi du message au destinataire seulement
            io.to(receiverId).emit('new_message', usr, msg, usr);
            //envoi du message à l'envoyeur
            socket.emit('new_message', usr, msg, channel);

            //dans le tableau des logs privés
            for (const conv of private_log) {
                //si les logs de cette conversation existent
                if(conv.includes(usr) && conv.includes(channel))
                {
                    if(conv[2].length == 20) conv[2].splice(0, 1);
                    conv[2].push([usr, msg]); 
                    
                }
            }
        }
    });

    //lorsqu'un user ouvre une nouvelle conversation privée
    socket.on('private_message', (sender, receiver) =>{
        //id du destinataire
        let receiverId = get_id_by_name(receiver);
        //envoi de la nouvelle conversation au destinataire
        io.to(receiverId).emit('new_private', sender, `<div class='text_container ${sender} hidden'><span class='start_private'>Coversation privée avec ${sender}</span></div>`, 'receiver');
        //envoi de la nouvelle conversation à l'envoyeur
        socket.emit('new_private', receiver, `<div class='text_container ${receiver} hidden'><span class='start_private'>Conversation privée avec ${receiver}</span></div>`, 'sender'); 
        //ajout des logs au tableau
        private_log.push([sender, receiver, []]);
    }); 

    //lorsqu'un utilisateur ferme la page
    socket.on('disconnect', () => {
        for (user of users) {
            //selection de l'user qui se deconnecte
            if(user[1] == socket.id){
                //nom de l'user
                let name = user[0];
                //index de l'user dans le tableau des users qui écrivent
                let index = is_writting.indexOf(user[0])
                //supression dans is_writting
                is_writting.splice(index, 1);
                //index de l'user das le tableau des users connectés
                index = users.indexOf(user);
                //supression de l'user
                users.splice(index, 1);
                //envoi d'un message general notifiant la déconnexion
                io.emit('new_message', 'Console', `${name} s'est déconnecté !`, 'general');
            }
        }
        //envoi des users connectés
        io.emit('give_user', users);
        //envoi des users qui ecrivent
        io.emit('user_writting', is_writting)
    });

});


