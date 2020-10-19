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
let chat_container = document.querySelector('.chat_box')

let current_page = 'general';
let opened_private = new Array();

let pseudo;

function close_last_page()
{
    for (let page of pages) {
        if(!$(page).hasClass('hidden')) $(page).addClass('hidden');
    }
}


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


$('body').click(ev => {
    pages = document.querySelectorAll('.text_container');
    if($(ev.target).hasClass('notif')) $(ev.target).removeClass('notif');
    if(ev.target.classList[0] == 'conn_usr')
    {
        receiver = ev.target.innerHTML;
        if(opened_private.includes(receiver))
        {
            current_page = receiver;
            open_page(receiver);
        } else {
            socket.emit('private_message', pseudo, receiver);
        }
        
    }
    if(ev.target.classList[0] == 'generalButton')
    {
        current_page = 'general';
        for (const field of pages) {
            if(!$(field).hasClass('hidden')) $(field).addClass('hidden');
        }
        console.log('page general')
        $(document.querySelector('.text_container.general')).removeClass('hidden')
    }
})




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


function connect_user(usr, id)
{
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

            socket.emit('new_message', usr, msg, current_page);
            //clear input
            $('#msg').val('');
        } else alert('La longueur de votre message doit se situer entre 0 et 2000')
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

let write_alert = document.querySelector('.writeAlert');
let str_users;
function get_users_writing(users_writting)
{
    write_alert.innerHTML = '';
    if($(write_alert).hasClass('hidden')) $(write_alert).removeClass('hidden');
    users_writting.forEach(user => {
        if(user == pseudo){

            const index = users_writting.indexOf(user)
            users_writting.splice(index, 1);
        }
    });
    if(users_writting.length > 0)
    {
        str_users = users_writting.toString();
        
        if(users_writting.length == 1) write_alert.innerHTML = `${str_users} est en train d'écrire...`;
        else
        {
            write_alert.innerHTML = `${str_users} sont en train d'écrire...`;
        }
    } else write_alert.innerHTML = '';
}

socket.on('give_log', (message_log, channel) => { 
    console.log(message_log);
    let sorted = sort_display_logs(message_log);
    let page_to_give_log = document.querySelector(`.text_container.${channel}`);
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


 let last_msg;
function get_message(usr, msg, channel)
{
    pages.forEach(page => {
        if($(page).hasClass(channel))
        {
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
                //affichage du message
                page.innerHTML += `<div class='message_container ${sender} ${usr} ${channel}'><span class='pseudo'>${usr}</span><span class='message'>${msg}</span></div>`;
                if(current_page != channel)
                {
                    $(document.querySelector(`.conn_usr.${channel}`)).addClass('notif');
                }
            }
            last_msg = document.querySelectorAll(`.message_container.${channel}`)
            last_msg = last_msg[last_msg.length-1];
        }
    });
   
    //si le message vient du serveur
    
    //positionnement de la page vers le bas
    window.scrollTo(0,document.body.scrollHeight);
}




let cpt=0;
function newEntry() 
{
    
    if(msgInput.value == '' && cpt == 1)
    { 
        socket.emit('write_event', pseudo, 0);
        cpt--;
    }
    if(msgInput.value.length > 0 && cpt == 0) 
    {
        socket.emit('write_event', pseudo, 1);
        cpt++;
    }
}

//confirmaton de connexion
socket.on('user_connected', (usr, id) => { connect_user(usr, id)});

//affichage d'erreur avec un alert
socket.on('err', error_msg => { alert(error_msg); });

//lorsque le serveur envoie un tableau avec tous les utilisateurs connectés
socket.on('give_user', users => { get_users(users); });


socket.on('user_writting', (users_writting) => { get_users_writing(users_writting); });

//lorsqu'on recoit un message
socket.on('new_message', (usr, msg, channel) => { get_message(usr, msg, channel); });



socket.on('new_private', (receiver, page, state) => {
    if(!opened_private.includes(receiver))
    {
        opened_private.push(receiver);
        chat_container.innerHTML += page;
        pages = document.querySelectorAll('.text_container');;

        if(state == 'sender')
        {
            open_page(receiver);
        }
    }
    
});

       