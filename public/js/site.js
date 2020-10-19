let socket = io();

let pseudoForm = document.getElementById('pseudoForm');
let pseudoDiv = document.querySelector('.askName');
let pseudoField = document.getElementById('pseudoField');
let chatDiv = document.querySelector('.app');
let msgInput = document.getElementById('msg');
let connected_field = document.getElementById('connected_users');
let profil_field = document.getElementById('usrName');
let pages = document.querySelectorAll('.text_container');
let connected_users = document.querySelectorAll('.conn_usr');
let chat_container = document.querySelector('.chat_box');

let current_page = 'general';
let opened_private = new Array();

let pseudo;


/**
 * Permet de fermer la la page ouverte
 */
function close_last_page()
{
    for (let page of pages) {
        if(!$(page).hasClass('hidden')) $(page).addClass('hidden');
    }
}


/**
 * Permet de fermer la derniere page et d'en ouvrir une autre
 * @param {String} page_name 
 */
function open_page(page_name)
{  
    for (let page of pages) {
        if($(page).hasClass(page_name) && $(page).hasClass('hidden')) 
        {
            close_last_page();
            $(page).removeClass('hidden');
            current_page = page.classList[1];
            console.log(`page ${page.classList[1]}`)
        }
    }
}

//evenement de click
$('body').click(ev => {
    //si on clique sur une conversation ayant une notification, on retire la notif de celle ci
    if($(ev.target).hasClass('notif')) $(ev.target).removeClass('notif');
    //mise a jour de la liste des pages
    pages = document.querySelectorAll('.text_container');
    //si on clique sur un user connecté
    if(ev.target.classList[0] == 'conn_usr')
    {
        //on recupere le pseudo de cet user
        receiver = ev.target.innerHTML;
        //si la page pv de cet user existe
        if(opened_private.includes(receiver))
        {
            //on l'ouvre
            current_page = receiver;
            open_page(receiver);
        } else {
            //demande de nouvelle conversation privée
            socket.emit('private_message', pseudo, receiver);
        }
        
    }
    //si on clique sur general
    if(ev.target.classList[0] == 'generalButton')
    {   
        //ouverture de general
        open_page('general');
    }
})



//envoi du pseudo
pseudoForm.addEventListener('submit', (ev) => {  
    //stopper l'envoi du form
    ev.preventDefault(true);        
    pseudo = pseudoField.value;
    //securisation pseudo
    if(pseudo == "" || pseudo == null || pseudo.length > 30) alert('Pseudo non valide');
    else
    {
        //demande de connexion d'un nouvel user
        socket.emit('new_user', pseudo);
    }
});

/**
 * Formate les logs recus par le serveur pour faciliter la lecture utilisateur
 * @param {Array} toSort 
 * @return {Array} contient les logs formatés
 */
function sort_display_logs(toSort)
{
    let sorted_logs = new Array();

    toSort.forEach(log => {
        let usr = log[0];
        let msg = log[1];
        if(sorted_logs.length > 0)
        {
            let lastLog = sorted_logs.length-1;
            if(sorted_logs[lastLog][0] == usr) sorted_logs[lastLog][1].push(msg);
            else sorted_logs.push([usr, [msg]]);
        } else sorted_logs.push([usr, [msg]])
    });
    
    return sorted_logs;
}


/**
 * Apres reception de validation de connexion, affiche l'application
 * @param {String} usr 
 * @param {String} id 
 */
function connect_user(usr, id)
{
    //ajout du pseudo dans le cercle de profil
    document.getElementById('title').innerHTML = usr;
    //on masque la page de demande de pseudo et on affiche le chat
    $(pseudoDiv).addClass('hidden');
    $(chatDiv).removeClass('hidden');

    //positionnement en bas de page
    window.scrollTo(0,document.body.scrollHeight);
    //focus de l'input
    msg.focus();

    $('.chatForm').submit(function(ev){
        ev.preventDefault();
        let msg = msgInput.value;
        //securisation message
        if(msg != '' && msg != null && msg != ' ' || msg.length > 300) 
        {
            //envoi d'un nouveau message au serveur
            socket.emit('new_message', usr, msg, current_page);
            //clear input
            $('#msg').val('');
        } else alert('La longueur de votre message doit se situer entre 1 et 2000')
    });   
}

function get_users(users)
{
    //nettoyage de l'<ul> contenant les users connectés
    connected_field.innerHTML = '';

    //pour chaques utilisateurs
    users.forEach(user => {
        //si le pseudo(tab) correspondau pseudo entré par l'utilisateur
        //alors on ajoute son pseudo dans la bulle de profil
        if(user[0] == pseudo) profil_field.innerHTML = user[0];

        //sinon on ajoute le pseudo dans la liste des utilisateurs connectés
        else connected_field.innerHTML += `<li class='conn_usr ${user[0]}'>${user[0]}</li>`;
    });
}

//on recupere le champ contenant les utilisateurs en train d'ecrire
let write_alert = document.querySelector('.writeAlert');
let str_users;

//lorsqu'un user est en train d'ecrire (reception message serveur)
function get_users_writing(users_writting)
{
    //efface le champ write_alert
    write_alert.innerHTML = '';
    //si le champs est masqué, on l'affiche
    if($(write_alert).hasClass('hidden')) $(write_alert).removeClass('hidden');

    //pour chaques utilisateurs qui ecrivent
    users_writting.forEach(user => {
        //si un utilisateur a le meme pseudo que l'user actif
        if(user == pseudo){
            //on le retire de la liste (pas besoin que l'user sache qu'il est lui meme en train d'eçrire)
            const index = users_writting.indexOf(user)
            users_writting.splice(index, 1);
        }
    });
    //si le tableau des user qui ecrivent n'est pas vide
    if(users_writting.length > 0)
    {
        //ajout des users dans une string
        str_users = users_writting.toString();
        
        if(users_writting.length == 1) write_alert.innerHTML = `${str_users} est en train d'écrire...`;
        else
        {
            write_alert.innerHTML = `${str_users} sont en train d'écrire...`;
        }
    } else write_alert.innerHTML = '';
}

// lorsque le serveur envoie des logs
socket.on('give_log', (message_log, channel) => {   
    //formattage des logs
    let sorted = sort_display_logs(message_log);
    //selection du channel des logs 
    let page_to_give_log = document.querySelector(`.text_container.${channel}`);
    //affichage des logs
    sorted.forEach(log => {
        let name = log[0];
        let messages = log[1];
        let log_string = '';
        messages.forEach(message => {
            log_string += `${message}<br/>`
        });

        if(name == pseudo) state = 'self';
        else state = 'other';
        page_to_give_log.innerHTML += `<div class='message_container ${state}'><span class='pseudo'>${name}</span><span class='message'>${log_string}</span></div>`;
    });
 })


//lorsque le serveur envoie un message
function get_message(usr, msg, channel)
{
    pages.forEach(page => {
        //on selectionne la page qui correspond au channel du message
        if($(page).hasClass(channel))
        {
            //si le message vient de la console
            if(usr == 'Console') 
            {   
                //alors on affiche le message en mode console
                page.innerHTML += `<span class='console_message'>${msg}</span><br/>`
            }
            // sinon si le message vient d'un user
            else 
            {
                
                let sender;
                //si l'envoyeur du message est l'utilisateur en cours
                if(usr == pseudo) 
                {
                    //on lui attribut la classe 'self'
                    sender = 'self';
        
                    //sinon -> classe 'other'
                } else sender = 'other';
                
                //si un message à déjà été envoyé avant
                if(page.lastChild.firstChild != null )
                {
                    //on recupere l'auteur de ce message
                    let pseudo_sender = page.lastChild.firstChild.innerHTML;
                    //si l'auteur du message d'avant est le meme que l'auteur du nouveau message
                    if(pseudo_sender == usr )
                    {
                        //on selectionne le dernier block de message
                        let last_msg = page.lastChild;
                        //on ajoute a ce dernier block de message, le nouveau message
                        last_msg.lastChild.innerHTML += `<br />${msg}`;
                      // sinon on ajoute un nouveau block de message en dessous  
                    } else page.innerHTML += `<div class='message_container ${sender} ${usr} ${channel}'><span class='pseudo'>${usr}</span><span class='message'>${msg}</span></div>`;
                } else page.innerHTML += `<div class='message_container ${sender} ${usr} ${channel}'><span class='pseudo'>${usr}</span><span class='message'>${msg}</span></div>`;
                
                //si ll'utilisateur recoit un message privé et qu'il n'est pas sur cette conversation
                if(current_page != channel)
                {
                    //on lance une notification sur un utilisateur connecté
                    $(document.querySelector(`.conn_usr.${channel}`)).addClass('notif');
                    //cration notification sonore
                    let notif_sound = new Audio('../songs/swiftly-610.ogg');
                    //lecture du son
                    notif_sound.play();
                }
            }
            last_msg = document.querySelectorAll(`.message_container.${channel}`)
            last_msg = last_msg[last_msg.length-1];
        }
    });
    
    //positionnement de la page vers le bas
    window.scrollTo(0,document.body.scrollHeight);
}




let cpt=0;
/**
 * Se declenche à chaque pression de touche si l'input de message est focus
 * permet d'envoyer les états d'écriture des users
 */
function newEntry() 
{
    //si l'input est vide
    if(msgInput.value == '' && cpt == 1)
    { 
        //envoi d'un arret d'ecriture au serveur
        socket.emit('write_event', pseudo, 0);
        cpt--;
    }
    //si l'input comporte des elementss
    if(msgInput.value.length > 0 && cpt == 0) 
    {
        //envoi d'un debut d'ecriture au serveur
        socket.emit('write_event', pseudo, 1);
        cpt++;
    }
}

socket.on('user_connected', (usr, id) => { connect_user(usr, id)});

//affichage d'erreur avec un alert
socket.on('err', error_msg => { alert(error_msg); });

socket.on('give_user', users => { get_users(users); });

socket.on('user_writting', (users_writting) => { get_users_writing(users_writting); });

socket.on('new_message', (usr, msg, channel) => { get_message(usr, msg, channel); });


//lorsque le serveur envoi une requete de creation de conversation privée
socket.on('new_private', (receiver, page, state) => {
    //si la conversation n'existe pas déjà
    if(!opened_private.includes(receiver))
    {
        //ajout de la conversation dans la liste des conversations ouvertes
        opened_private.push(receiver);
        //ajout de la conversation sur la page
        chat_container.innerHTML += page;
        //mise à jour des pages
        pages = document.querySelectorAll('.text_container');;

        //ouverture de la page pour celui qui a lancé la conversation
        if(state == 'sender')
        {
            open_page(receiver);
        }
    }
    
});

       