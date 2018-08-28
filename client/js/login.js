'use strict';

var API_URL = 'http://localhost:3000/api/'

    var credentials = {
        username: $('#username').val(),
        password: $('#password').val()
    }

    console.log(credentials);

    function login(e) {
        if (e) {
            e.preventDefault()
        }

        console.log(credentials);
        
        $.ajax({
            url: API_URL + 'CustomUsers/login',
            type: 'post',
            data: {
                    'username': document.getElementById('username').value.toLowerCase(),
                    'password': document.getElementById('password').value 
            },
            success: function(session) {
                console.log(session);
                $.ajax({
                    url: API_URL + 'CustomUsers/' +
                         session.userId +
                        '?access_token=' + session.id,
                    type: 'get',
                    success: function(user) {
                        window.localStorage.setItem("$w-token",JSON.stringify(session));
                        window.localStorage.setItem("$w-user",JSON.stringify(user));

                        if (user.rol === "Administrador") {
                            window.location.href = "./admin.html";
                            return false;
                        } else {
                            window.location.href = "./usuario.html";
                            return false;
                        }
                    },
                    error: function(err) {
                        console.log('Error trying to retrieve user', err)
                    }
                })
            },
            error: function(err) {
                console.log('Error trying to login', err)
            }

        })
    }
