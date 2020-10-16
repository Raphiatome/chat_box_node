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
let opened_pages = new Array();

let pseudo;

function getOpn(){console.log(opened_pages)}


$('body').click(ev => {
    pages = document.querySelectorAll('.text_container');
    if(ev.target.classList[0] == 'conn_usr')
    {
        let receiver = ev.target.innerHTML;
        if(!opened_pages.includes(receiver))
        {
            opened_pages.push(receiver)
            socket.emit('private_msg', pseudo, receiver)
        }
        else {
            for (const field of pages) {
                if(!$(field).hasClass('hidden')) console.log(field);
                current_page = field.classList[1];
            }
            
        }
    }
    if(ev.target.classList[0] == 'generalButton')
    {
        current_page = 'general';
        for (const field of pages) {
            if(!$(field).hasClass('hidden')) $(field).addClass('hidden');
        }
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
        console.log(ev)
        ev.preventDefault();
        let msg = msgInput.value;
        //securisation message
        if(msg != '' && msg != null && msg != ' ') 
        {

            socket.emit('new_message', usr, msg, current_page);
            //clear input
            $('#msg').val('');
        }
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
        else connected_field.innerHTML += `<li class='conn_usr'>${user[0]}</li>`;
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


function get_message(usr, msg, channel)
{
    let test = '.text_container.'+channel
    pages.forEach(page => {
        if($(page).hasClass(channel))
        {
            console.log(page)
            if(usr == 'Console') 
            {   
                console.log('zazou')
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
                page.innerHTML += `<div class='message_container ${sender}'><span class='pseudo'>${usr}</span><span class='message'>${msg}</span></div>`;
            }
        }
    });
   
    //si le message vient du serveur
    
    //positionnement de la page vers le bas
    window.scrollTo(0,document.body.scrollHeight);
}

socket.on('private', (usr) => {
    for (const field of pages) {
        if(!$(field).hasClass('hidden')) $(field).addClass('hidden');
    }

    current_page = usr;
    chat_container.innerHTML += "<div class='text_container "+usr+"'>youpi</div>";

});





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

socket.on('give_log', message_log => { sort_display_logs(message_log); })

       