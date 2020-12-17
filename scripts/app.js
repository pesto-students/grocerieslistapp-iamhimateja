// TODO: grocery item - CRUD actions
// TODO: Validations
"use strict";
const randomKey = () => Math.random()
  .toString(36)
  .substr(2, 5);

function App() {
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
              password: element.password,
              groceryList: {}
            };
            element.groceryList.forEach(function(groceryItem, index) {
              groupedData[element.name].groceryList[randomKey()] = groceryItem;
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
    return $this.currentUser()
      .groceryList[id];
  };

  $this.addGroceryItem = (itemName, itemQuantity) => {
    if (itemName == "") throw "Item name shouldn't be blank";
    const itemObject = {
      itemName: itemName,
      quantity: (itemQuantity || 1),
      completed: false
    };
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    let itemKey = randomKey();
    usersList[currentUser.name].groceryList[itemKey] = itemObject;
    localStorage.setItem("users", JSON.stringify(usersList));
    $this.addGroceryItemToUIAndBindEvents(itemKey, itemObject);
  };

  $this.updateGroceryItem = (itemKey, itemName, itemQuantity) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    let groceryItem = usersList[currentUser.name].groceryList[itemKey];
    groceryItem.itemName = itemName;
    groceryItem.quantity = itemQuantity;
    localStorage.setItem("users", JSON.stringify(usersList));
    $this.updateGroceryItemUI(itemKey)
  };

  $this.toggleGroceryItemCompletedStatus = (checked, itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser()
      .name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      groceryItem.completed = checked;
    }
    localStorage.setItem("users", JSON.stringify(usersList));
  };

  $this.deleteGroceryItem = (itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser()
      .name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      delete currentUser.groceryList[itemKey];
    }
    $this.deleteGroceryItemFromUI(itemKey);
    localStorage.setItem("users", JSON.stringify(usersList));
  };

  $this.logIn = (username) => {
    sessionStorage.setItem("currentUser", username);
    document.getElementById("current-user-name").innerHTML = `${$this.currentUser().name}'s`;
    $this.addGroceryItemsToUI();
  };

  $this.logOut = () => {
    sessionStorage.removeItem("currentUser");
    $this.toggleLoginScreen("open");
    $this.toggleGroceryScreen("close");
  };

  $this.createNewUserAndLogIn = (username) => {
    let data = $this.users();
    data[username] = {
      name: username,
      password: false,
      groceryList: {}
    };
    localStorage.setItem("users", JSON.stringify(data));
    $this.logIn(username);
    return $this.findUser[username];
  };

  $this.addGroceryItemsToUI = () => {
    const groceryList = $this.currentUser()
      .groceryList;
    const groceryListItems = groceriesListElement.querySelectorAll('li:not(.empty-message)');
    if (groceryListItems) {
      groceryListItems.forEach(listElement => listElement.parentNode.removeChild(listElement));
    }
    for (let key in groceryList) {
      $this.addGroceryItemToUIAndBindEvents(key, groceryList[key]);
    }
    $this.toggleEmptyMessage()
  };

  $this.addGroceryItemToUIAndBindEvents = (id, groceryItem) => {
    let listElement = document.createElement("li");
    let listLabel = document.createElement("label");
    let listLabelCheckBox = document.createElement("input");
    let listLabelNameElement = document.createElement("span");
    let listLabelQuantityElement = document.createElement("span");
    let actionButtonsWrap = document.createElement("div");
    let editButton = document.createElement("button");
    let deleteButton = document.createElement("button");
    listElement.classList += "grocery-list-item";
    listElement.setAttribute("data-id", id);
    listLabelCheckBox.type = "checkbox";
    listLabelCheckBox.name = "groceryItem";
    listLabelCheckBox.value = id;
    listLabelNameElement.classList += "item-name";
    listLabelQuantityElement.classList.add("item-quantity")
    actionButtonsWrap.classList += "action-buttons";
    editButton.classList += "btn edit";
    deleteButton.classList += "btn delete";
    editButton.setAttribute("data-id", id);
    deleteButton.setAttribute("data-id", id);
    listLabelNameElement.innerHTML = groceryItem.itemName;
    listLabelQuantityElement.innerHTML = groceryItem.quantity;
    editButton.innerHTML = "Edit";
    deleteButton.innerHTML = "Delete";
    if (groceryItem.completed) {
      listLabelCheckBox.checked = groceryItem.completed;
      listElement.classList += " completed";
    }
    listLabel.append(listLabelCheckBox);
    listLabel.append(listLabelNameElement);
    listLabel.append(listLabelQuantityElement);
    listElement.append(listLabel);
    actionButtonsWrap.append(editButton);
    actionButtonsWrap.append(deleteButton);
    listElement.append(actionButtonsWrap);
    groceriesListElement.append(listElement);
    $this.toggleEmptyMessage()
    listElement.querySelector("input[type='checkbox']")
      .addEventListener("change", function(event) {
        const targetElement = document.querySelector(".grocery-list-item[data-id='" + this.value + "']");
        $this.toggleGroceryItemCompletedStatus(this.checked, this.value);
        if (this.checked) {
          targetElement.classList.add("completed");
        } else {
          targetElement.classList.remove("completed");
        }
      });
    listElement.querySelector(".btn.delete")
      .addEventListener("click", function(event) {
        const itemKey = this.dataset.id;
        $this.deleteGroceryItem(itemKey);
      });

    listElement.querySelector(".btn.edit")
      .addEventListener("click", function(event) {
        const itemKey = this.dataset.id;
        $this.toggleEditForm(itemKey, "open");
      });
  };

  $this.updateGroceryItemUI = (itemKey) => {
    const groceryItem = $this.findGrocerylistItem(itemKey);
    const targetedGroceryItemElement = document.querySelector(`.grocery-list-item[data-id="${itemKey}"]`);
    targetedGroceryItemElement.querySelector(".item-name").innerHTML = groceryItem.itemName;
    targetedGroceryItemElement.querySelector(".item-quantity").innerHTML = groceryItem.quantity;
    $this.highlightElement(targetedGroceryItemElement);
  };

  $this.deleteGroceryItemFromUI = (itemKey) => {
    const groceryItem = document.querySelector(".grocery-list-item[data-id='" + itemKey + "']");
    groceryItem.remove();
    $this.toggleEmptyMessage()
  };

  $this.toggleBreakingBadScreen = (toggle) => {
    switch (toggle) {
      case "open":
        breakingBadContainer.classList.remove("hide")
        breakingBadContainer.classList.remove("closed");
        break;
      case "close":
        breakingBadContainer.classList.add("closed");
        setTimeout(function () {
          breakingBadContainer.classList.add("hide")
        }, 200)
        break;
    }
  };

  $this.toggleLoginScreen = (toggle) => {
    switch (toggle) {
      case "open":
        loginContainer.classList.remove("close");
        break;
      case "close":
        loginContainer.classList.add("close");
        break;
    }
  };

  $this.togglePasswordPromptUI = (username, toggle) => {
    switch (toggle) {
      case "open":
        passwordPromptContainer.querySelector(".attempter-user-name")
          .innerHTML = username
        passwordPromptContainer.querySelector(".attempter-user-name")
          .setAttribute('data-user', username);
        $this.toggleLoginScreen('open')
        loginContainer.classList.add("password-verification-in-progress");
        passwordPromptContainer.classList.remove("close");
        break;
      case "close":
        passwordPromptContainer.classList.add("close");
        loginContainer.classList.remove("password-verification-in-progress");
        passwordPromptContainer.querySelector(".attempter-user-name")
          .removeAttribute('data-user');
        document.getElementById("password").value = ''
        break;
    }
  }

  $this.toggleEditForm = (itemKey, toggle) => {
    switch (toggle) {
      case "open":
        const grocerylistItem = $this.findGrocerylistItem(itemKey);
        document.getElementById("edit-item-name-input").value = grocerylistItem.itemName;
        document.getElementById("edit-item-quantity-input").value = grocerylistItem.quantity;
        document.getElementById("edit-item-button").setAttribute("data-id", itemKey);
        editFormContainer.classList.remove("close");
        groceryScreen.classList.add("blurred")
        break;
      case "close":
        editFormContainer.classList.add("close");
        groceryScreen.classList.remove("blurred")
        break;
    }
  }

  $this.toggleEmptyMessage = () => {
    const emptyMessageDiv = groceriesListElement.querySelector("li.empty-message")
    if (groceriesListElement.querySelectorAll("li:not(.empty-message)")
      .length == 0) {
      emptyMessageDiv.classList.remove("hide")
    } else {
      emptyMessageDiv.classList.add("hide")
    }
  }

  $this.toggleGroceryScreen = (toggle) => {
    switch (toggle) {
      case "open":
        groceryScreen.classList.add("show");
        break;
      case "close":
        groceryScreen.classList.remove("show");
        break;
    }
  };

  $this.toggleSettingsUI = (toggle) => {
    switch (toggle) {
      case "open":
        const currentUser = $this.currentUser();
        if (currentUser && currentUser.password) {
          document.getElementById("old-password-prompt").classList.remove('hide')
        } else {
          document.getElementById("old-password-prompt").classList.add('hide')
        }
        userSettingsElement.classList.remove("close");
        groceryScreen.classList.add("blurred")
        break;
      case "close":
        userSettingsElement.classList.add("close");
        groceryScreen.classList.remove("blurred")
        break;
    }
  };

  $this.highlightElement = (targetElement) => {
    setTimeout(function () {
      targetElement.classList.add("pulse");
    }, 500)
    setTimeout(function () {
      targetElement.classList.remove("pulse");
    }, 1000)
  };

  // Validations

  $this.validateChangePasswordForm = () => {
    
  }

};

window.addEventListener("load", function() {
  const app = new App();
  window.breakingBadContainer = document.getElementById("breaking-bad");
  window.loginContainer = document.getElementById("login");
  window.passwordPromptContainer = document.getElementById("login-step-2");
  window.editFormContainer = document.getElementById("edit-form");
  window.groceryScreen = document.getElementById("grocery-list-wrapper");
  window.groceriesListElement = document.getElementById("groceries-list");
  window.userSettingsElement = document.getElementById("user-settings");

  document.getElementById("username")
    .addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        if (this.value.length == 0) {
          console.log("Name is not valid");
        } else {
          const foundUser = app.findUser(this.value);
          if (foundUser) {
            if (foundUser.password) {
              console.log("password need to continue");
              app.togglePasswordPromptUI(this.value, "open")
            } else {
              app.logIn(this.value);
              app.toggleLoginScreen("close");
              app.toggleGroceryScreen("open");
            }
          } else {
            app.createNewUserAndLogIn(this.value);
            app.toggleLoginScreen("close");
            app.toggleGroceryScreen("open");
          }
        }
      }
    });

  document.getElementById("password")
    .addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        if (this.value.length == 0) {
          console.log("Please enter the password");
        } else {
          const userInputPassword = this.value;
          const attemptingUser = passwordPromptContainer.querySelector(".attempter-user-name")
            .dataset.user;
          const user = app.findUser(attemptingUser);
          if (user) {
            if (userInputPassword == window.atob(user.password)) {
              app.togglePasswordPromptUI(attemptingUser, "close")
              app.logIn(user.name);
              app.toggleLoginScreen("close");
              app.toggleGroceryScreen("open");
            } else {
              console.log('Incorrect');
            }
          }
        }
      }
    })

  document.getElementById("settings-password-confirmation")
    .addEventListener("keyup", function(event) {
      const passwordInput = document.getElementById("settings-password");
      if ((passwordInput.value != "")) {
        if (passwordInput.value != this.value) {
          this.classList.add("has-error")
          this.classList.remove("no-error")
        } else {
          this.classList.remove("has-error")
          this.classList.add("no-error")
        }
      }
    })

  document.getElementById("item-name")
    .addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        document.getElementById("add-item").click();
      }
    });

  document.getElementById("item-quantity")
    .addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        document.getElementById("add-item").click();
      }
    });

  document.getElementById("add-item")
    .addEventListener("click", function(event) {
      const inputValueElement = document.getElementById("item-name");
      if (inputValueElement.value.length == 0) {
        console.log("Item name shouldn't be blank.");
      } else {
        const itemQuantityElement = document.getElementById("item-quantity");
        app.addGroceryItem(inputValueElement.value, itemQuantityElement.value);
        inputValueElement.value = "";
        itemQuantityElement.value = 1;
      }
    });

  document.getElementById("change-password")
    .addEventListener("click", function(event) {
      app.toggleSettingsUI('open')
    })

  document.getElementById("close-user-settings")
    .addEventListener("click", function(event) {
      app.toggleSettingsUI('close')
    })

  document.getElementById("close-item-edit-form")
    .addEventListener("click", function(event) {
      app.toggleEditForm(null, 'close')
    })

  document.getElementById("logout")
    .addEventListener("click", function(event) {
      app.logOut();
    });

  document.querySelectorAll(".password-peek .emoji")
    .forEach(peekElement => {
      peekElement.addEventListener("click", function(event) {
        const parentElement = this.parentElement;
        switch (parentElement.dataset.status) {
          case "open":
            parentElement.querySelector('.emoji.closed')
              .classList.add("show")
            parentElement.querySelector('.emoji.open')
              .classList.remove("show")
            parentElement.setAttribute("data-status", "closed")
            parentElement.previousElementSibling.setAttribute("type", "password")
            break;
          case "closed":
            parentElement.querySelector('.emoji.closed')
              .classList.remove("show")
            parentElement.querySelector('.emoji.open')
              .classList.add("show")
            parentElement.setAttribute("data-status", "open")
            parentElement.previousElementSibling.setAttribute("type", "text")
            break;
        }
      });
    });
  document.getElementById("menu-trigger")
    .addEventListener("click", function(event) {
      if (this.classList.contains('opened')) {
        this.classList.remove('opened')
        document.getElementById("settings-menu")
          .classList.remove('opened')
      } else {
        this.classList.add('opened')
        document.getElementById("settings-menu")
          .classList.add('opened')
      }
    })

  document.querySelectorAll(".actor").forEach(actorElement => {
    actorElement.addEventListener("click", function(event) {
      const $this = this;
      document.querySelectorAll(`.actor:not(#${$this.getAttribute("id")})`).forEach(element => {
        element.classList.add("disappear")
      });
      
      setTimeout(function(){
        $this.classList.add('selectedCharecter')
      }, 500);

      setTimeout(function() {
        app.toggleBreakingBadScreen('close')
        if ($this.id == "normal-user") {
          app.toggleLoginScreen("open");
        } else {
          app.togglePasswordPromptUI($this.dataset.username, "open")
        }
      }, 800);
    })
  });

  document.getElementById("edit-item-name-input").addEventListener("keyup", function (event) {
    let updateGroceryItemButton = document.getElementById("edit-item-button");
    updateGroceryItemButton.disabled = (this.value == "" || document.getElementById("edit-item-quantity-input").value == "")
    if (this.value == "") {
      this.classList.add("has-error")
    } else {
      this.classList.remove("has-error")
    }
    if (event.keyCode === 13 && !this.classList.contains("has-error")) {
      updateGroceryItemButton.click();
    }
  })

  document.getElementById("edit-item-quantity-input").addEventListener("keyup", function (event) {
    let updateGroceryItemButton = document.getElementById("edit-item-button");
    updateGroceryItemButton.disabled = (this.value == "" || document.getElementById("edit-item-name-input").value == "")
    if (this.value == "") {
      this.classList.add("has-error")
    } else {
      this.classList.remove("has-error")
    }
    if (event.keyCode === 13 && !this.classList.contains("has-error")) {
      updateGroceryItemButton.click();
    }
  })

  document.getElementById("edit-item-button").addEventListener("click", function (event) {
    const itemKey = this.dataset.id;
    const updatedItemName = document.getElementById("edit-item-name-input").value;
    const updatedItemQuantity = document.getElementById("edit-item-quantity-input").value;
    app.updateGroceryItem(itemKey, updatedItemName, updatedItemQuantity)
    app.toggleEditForm(itemKey, "close")
  })

  document.querySelectorAll(".go-back").forEach(element => {
    element.addEventListener("click", function (event) {
      const target = this.dataset.target;
      switch (target) {
        case "login":
          app.togglePasswordPromptUI(null, "close")
          app.toggleLoginScreen("open");
          break;
        case "home":
          app.toggleLoginScreen("close");
          app.toggleBreakingBadScreen('open')
          setTimeout(function () {
            document.querySelectorAll(".actor.disappear").forEach(actor => actor.classList.remove("disappear"))
            document.querySelector(".actor.selectedCharecter").classList.remove("selectedCharecter");
          }, 90)
          break;
      }
    });
  });

  setTimeout(function () {
    document.body.classList.remove('content-is-loading');
    if (app.currentUser()) {
      app.toggleLoginScreen("close");
      app.toggleBreakingBadScreen('close')
      app.toggleGroceryScreen("open");
      app.logIn(app.currentUser().name);
    } else {
      app.toggleBreakingBadScreen('open');
    }
  }, 2000)

});