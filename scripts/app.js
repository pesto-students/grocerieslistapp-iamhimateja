// TODO: grocery item - CRUD actions
// TODO: Validations

'use strict';

const userData = () => {
  return JSON.parse(localStorage.getItem("users"));
}

const currentUserData = () => {
  if (sessionStorage.getItem("currentUser")) {
    return users[sessionStorage.getItem("currentUser")]
  }
}

const getUser = (username) => {
  return users[username]
}

const isUserExists = (username) => {
  return users[username]
}

const LogIn = (username) => {
  sessionStorage.setItem("currentUser", username)
  window.currentUser = currentUserData();
}

const toggleLoginScreen = (toggle = "open") => {
  switch (toggle) {
    case "open":
      loginContainer.classList.remove("close")
      break;
    case "close":
      loginContainer.classList.add("close")
      break;
  }
}

const createNewUserAndLogIn = (username) => {
  users[username] = {
    name: username,
    goceryList: []
  }
  localStorage.setItem("users", JSON.stringify(users));
  window.users = userData();
  LogIn(username)
  window.currentUser = currentUserData();
  return users[username];
}

const loadDummyData = async () => {
  const dummyData = await fetch("../data/users.json").then(response => response.json()).then(data => {
    let groupedData = localStorage.getItem("users") ? JSON.parse(localStorage.getItem("users")) : {}
    data.forEach((element, index) => {
      if (!groupedData[element.name]) {
        groupedData[element.name] = element
      }
    });
    localStorage.setItem("users", JSON.stringify(groupedData));
  })
  return dummyData;
}

const addGroceryItem = (itemName) => {
  if (itemName == "")
    throw "Item name shouldn't be blank" 

  currentUser.goceryList.push({
  })
}

window.addEventListener("load", function () {
  loadDummyData()
  window.users = userData();
  window.currentUser = currentUserData();
  window.loginContainer = document.getElementById("login");
  const usernameInput = document.getElementById("username");
  usernameInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      if (this.value.length == 0) {
        console.log("Name is not valid");
      } else {
        if (isUserExists(this.value)) {
          LogIn(this.value)
          toggleLoginScreen('close')
        } else {
          createNewUserAndLogIn(this.value)
          toggleLoginScreen('close')
        }
      }
    }
  });

  document.getElementById("item-name").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      if (this.value.length == 0) {
        console.log("Item name shouldn't be blank.");
      } else {
        addGroceryItem(this.value)
      }
    }
  });

  if (currentUser) {
    toggleLoginScreen('close')
    document.getElementById("currrent-user-name").innerHTML = `${currentUser.name}'s`
    // alert(currentUser.name + " Already signed in")
  }
})
