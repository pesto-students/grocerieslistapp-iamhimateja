// TODO: grocery item - CRUD actions
// TODO: Validations
"use strict";

const randomKey = () => Math.random().toString(36).substr(2, 5);

function App(maxItems) {
  let $this = this;
  $this.loadDummyData = async () => {
    const dummyData = await fetch("../data/users.json")
      .then((response) => response.json())
      .then((data) => {
        let groupedData = localStorage.getItem("users") ? $this.users() : {};
        data.forEach((element, index) => {
          if (!groupedData[element.name]) {
            groupedData[element.name] = {
              name: element.name,
              groceryList: {}
            };
            element.groceryList.forEach(function (groceryItem, index) {
              groupedData[element.name].groceryList[
                randomKey()
              ] = groceryItem;
            });
          }
        });
        localStorage.setItem("users", JSON.stringify(groupedData));
      });
    return localStorage.getItem("users");
  };

  $this.loadDummyData();
  $this.users = () => JSON.parse(localStorage.getItem("users")) || {};

  $this.currentUser = () => {
    if (sessionStorage.getItem("currentUser")) {
      return $this.users()[sessionStorage.getItem("currentUser")];
    }
  };

  $this.findUser = (username) => {
    return $this.users()[username];
  };

  $this.findGrocerylistItem = (id) => {
    return $this.currentUser().groceryList[id];
  };

  $this.LogIn = (username) => {
    sessionStorage.setItem("currentUser", username);
    document.getElementById("currrent-user-name").innerHTML = `${
      $this.currentUser().name
    }'s`;
    $this.addGroceryItemsToUI();
  };

  $this.LogOut = () => {
    sessionStorage.removeItem("currentUser");
    $this.toggleLoginScreen("open");
    $this.toggleGroceryScreen("close");
  };

  $this.createNewUserAndLogIn = (username) => {
    let data = $this.users();
    data[username] = {
      name: username,
      groceryList: []
    };
    localStorage.setItem("users", JSON.stringify(data));
    $this.LogIn(username);
    return $this.findUser[username];
  };

  $this.toggleLoginScreen = (toggle = "open") => {
    switch (toggle) {
      case "open":
        loginContainer.classList.remove("close");
        break;
      case "close":
        loginContainer.classList.add("close");
        break;
    }
  };

  $this.addGroceryItemsToUI = () => {
    const groceryList = $this.currentUser().groceryList;
    groceriesListElement.innerHTML = "";
    for (let key in groceryList) {
      $this.addGroceryItemAndBindEvents(key, groceryList[key]);
    }
  };

  $this.addGroceryItemAndBindEvents = (id, groceryItem) => {
    let listElement = document.createElement("li");
    let listLabel = document.createElement("label");
    let listLabelCheckBox = document.createElement("input");
    let listLabelNameElement = document.createElement("span");
    let actionButtonsWrap = document.createElement("div");
    let editButton = document.createElement("button");
    let deleteButton = document.createElement("button");
    listElement.classList += "grocery-list-item";
    listElement.setAttribute("data-id", id);
    listLabelCheckBox.type = "checkbox";
    listLabelCheckBox.name = "groceryItem";
    listLabelCheckBox.value = id;
    listLabelNameElement.classList += "item-name";
    actionButtonsWrap.classList += "action-buttons";
    editButton.classList += "btn edit";
    deleteButton.classList += "btn delete";
    editButton.setAttribute("data-id", id);
    deleteButton.setAttribute("data-id", id);
    listLabelNameElement.innerHTML = groceryItem.itemName;
    editButton.innerHTML = "Edit";
    deleteButton.innerHTML = "Delete";
    if (groceryItem.completed) {
      listLabelCheckBox.checked = groceryItem.completed;
      listElement.classList += " completed";
    }
    listLabel.append(listLabelCheckBox);
    listLabel.append(listLabelNameElement);
    listElement.append(listLabel);
    actionButtonsWrap.append(editButton);
    actionButtonsWrap.append(deleteButton);
    listElement.append(actionButtonsWrap);
    groceriesListElement.append(listElement);

    listElement
      .querySelector("input[type='checkbox']")
      .addEventListener("change", function (event) {
        const targetElement = document.querySelector(
          ".grocery-list-item[data-id='" + this.value + "']"
        );
        $this.toggleGroceryItemCompletedStatus(this.checked, this.value);
        if (this.checked) {
          targetElement.classList.add("completed");
        } else {
          targetElement.classList.remove("completed");
        }
      });

    listElement
      .querySelector(".btn.delete")
      .addEventListener("click", function (event) {
        const itemKey = this.dataset.id;
        $this.deleteGroceryItem(itemKey);
      });
  };

  $this.toggleGroceryScreen = (toggle = "open") => {
    switch (toggle) {
      case "open":
        groceryScreen.classList.add("show");
        break;
      case "close":
        groceryScreen.classList.remove("show");
        break;
    }
  };

  $this.addGroceryItem = (itemName) => {
    if (itemName == "") throw "Item name shouldn't be blank";
    const itemObject = {
      itemName: itemName,
      completed: false
    };
    let currentUser = $this.currentUser();
    let usersList = $this.users();
    let itemKey = randomKey();
    usersList[currentUser.name].groceryList[itemKey] = itemObject;
    localStorage.setItem("users", JSON.stringify(usersList));
    $this.addGroceryItemAndBindEvents(itemKey, itemObject);
  };

  $this.deleteGroceryItem = (itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      delete currentUser.groceryList[itemKey];
    }
    $this.deleteGroceryItemFromUI(itemKey);
    localStorage.setItem("users", JSON.stringify(usersList));
  };

  $this.deleteGroceryItemFromUI = (itemKey) => {
    const groceryItem = document.querySelector(
      ".grocery-list-item[data-id='" + itemKey + "']"
    );
    groceryItem.remove();
  };

  $this.toggleGroceryItemCompletedStatus = (checked, itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      groceryItem.completed = checked;
    }
    localStorage.setItem("users", JSON.stringify(usersList));
  };
}

window.addEventListener("load", function () {
  const app = new App(5);
  console.log(app.currentUser());
  window.loginContainer = document.getElementById("login");
  window.groceryScreen = document.getElementById("grocery-list-wrapper");
  window.groceriesListElement = document.getElementById("groceries-list");
  const usernameInput = document.getElementById("username");
  usernameInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      if (this.value.length == 0) {
        console.log("Name is not valid");
      } else {
        if (app.findUser(this.value)) {
          app.LogIn(this.value);
          app.toggleLoginScreen("close");
          app.toggleGroceryScreen("open");
        } else {
          app.createNewUserAndLogIn(this.value);
          app.toggleLoginScreen("close");
          app.toggleGroceryScreen("open");
        }
      }
    }
  });

  document
    .getElementById("item-name")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        document.getElementById("add-item").click();
      }
    });

  document
    .getElementById("add-item")
    .addEventListener("click", function (event) {
      const inputElement = document.getElementById("item-name");
      if (inputElement.value.length == 0) {
        console.log("Item name shouldn't be blank.");
      } else {
        app.addGroceryItem(inputElement.value);
        inputElement.value = "";
      }
    });

  document.getElementById("logout").addEventListener("click", function (event) {
    app.LogOut();
  });

  if (app.currentUser()) {
    app.toggleLoginScreen("close");
    app.toggleGroceryScreen("open");
    app.LogIn(app.currentUser().name);
  } else {
    app.toggleLoginScreen();
  }
});
