"use strict";
const randomKey = () => Math.random()
  .toString(36)
  .substr(2, 5);

const $select = (type, selector) => {
  switch (type) {
  case "id":
    return document.getElementById(selector);
  case "multiple-elements":
    return document.querySelectorAll(selector);;
  case "single-element":
    return document.querySelector(selector);
  default:
    return null
  }
}

const encodePassword = (password) => {
  return window.btoa(password);
}

const decodePassword = (password) => {
  return window.atob(password);
}

const updateActors = () => {
  $select("multiple-elements", ".actor").forEach(element => {
    const user = app.findUser(element.dataset.username);
    const currentUser = app.currentUser();
    if (user) {
      if(user.password != encodePassword(element.querySelector('.charecter-password').innerText)) {
        element.querySelector('.charecter-password').innerText = "(changed)"
      }
      if (currentUser) {
        if (currentUser.name == user.name) {
          element.classList.add("selectedCharecter");
        }
      }
    }
  });
}

function App() {
  let $this = this;
  const MAX_GROCERY_ITEMS_COUNT = 5;
  
  $this.init = async () => {
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
            element.groceryList.forEach(function (groceryItem, index) {
              groupedData[element.name].groceryList[randomKey()] = groceryItem;
            });
          }
        });
        $this.updateDatabase(groupedData);
      });
    return localStorage.getItem("users");
  };

  $this.updateDatabase = (data) => {
    localStorage.setItem("users", JSON.stringify(data));
  }
  
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

  // Validations

  $this.validateGroceryItemsCount = () => {
    return $this.totalItemCount() < MAX_GROCERY_ITEMS_COUNT
  }

  $this.isItemNameExists = (itemName, itemKey = "") => {
    let allGroceryItemNames = Object.values(app.currentUser().groceryList).map(item => item.itemName)
    
    if (itemKey != "") {
      const groceryItem = $this.findGrocerylistItem(itemKey);
      if (groceryItem) {
        const elementIndex = allGroceryItemNames.indexOf(groceryItem.itemName);
        if (elementIndex > -1) {
          allGroceryItemNames.splice(elementIndex, 1);
        }
      }
    }
    
    return allGroceryItemNames.includes(itemName);
  }
  
  $this.isValidPassword = (password) => {
    const currentUser = $this.currentUser();
    return currentUser.password && (currentUser.password == encodePassword(password))
  }
  
  $this.addGroceryItem = (itemName, itemQuantity) => {
    if (itemName == "") throw "Item name shouldn't be blank";
    if ($this.validateGroceryItemsCount()) {
      const itemObject = {
        itemName: itemName,
        quantity: (itemQuantity || 1),
        completed: false
      };
      let usersList = $this.users();
      let currentUser = usersList[$this.currentUser().name];
      let itemKey = randomKey();
      usersList[currentUser.name].groceryList[itemKey] = itemObject;
      $this.updateDatabase(usersList);
      $this.addGroceryItemToUIAndBindEvents(itemKey, itemObject);
      $this.showNotification("Successfully added the item.");
    } else {
      app.showValidationMessage("#new-item-form", `Items limit exceeded, You can only add ${MAX_GROCERY_ITEMS_COUNT} items to the list.`);
    }
  };
  
  $this.updateGroceryItem = (itemKey, itemName, itemQuantity) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    let groceryItem = usersList[currentUser.name].groceryList[itemKey];
    groceryItem.itemName = itemName;
    groceryItem.quantity = itemQuantity;
    $this.updateDatabase(usersList);
    $this.updateGroceryItemUI(itemKey)
    $this.showNotification("Successfully updated the item.");
  };
  
  $this.toggleGroceryItemCompletedStatus = (checked, itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser()
      .name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      groceryItem.completed = checked;
    }
    $this.updateDatabase(usersList);
    $this.showNotification(checked ? "Successfully marked it as completed." : "Item marked as incomplete.");
  };
  
  $this.deleteGroceryItem = (itemKey) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser()
      .name];
    let groceryItem = currentUser.groceryList[itemKey];
    if (groceryItem) {
      delete currentUser.groceryList[itemKey];
    }
    $this.updateDatabase(usersList);
    $this.deleteGroceryItemFromUI(itemKey);
    $this.showNotification("Grocery item deleted.");
  };

  $this.totalItemCount = () => {
    return Object.keys($this.currentUser().groceryList).length;
  }

  $this.remainingItemCount = () => {
    return (MAX_GROCERY_ITEMS_COUNT - $this.totalItemCount())
  }

  $this.maxGroceryItems = () => {
    return MAX_GROCERY_ITEMS_COUNT;
  }
  
  $this.logIn = (username) => {
    sessionStorage.setItem("currentUser", username);
    $select("id", "current-user-name").innerHTML = `${$this.currentUser().name}'s`;
    $this.addGroceryItemsToUI();
    $this.showNotification(`Welcome ${$this.currentUser().name}`);
  };
  
  $this.logOut = () => {
    sessionStorage.removeItem("currentUser");
    $this.toggleLoginScreen("open");
    $this.toggleGroceryScreen("close");
    $this.showNotification("You logged out successfully.")
  };

  $this.updateUserPassword = (password) => {
    let usersList = $this.users();
    let currentUser = usersList[$this.currentUser().name];
    currentUser.password = encodePassword(password);
    $this.updateDatabase(usersList);
    $this.toggleSettingsUI("close")
    $this.showNotification("Password updated successfully.");
  }
  
  $this.createNewUserAndLogIn = (username) => {
    let data = $this.users();
    data[username] = {
      name: username,
      password: false,
      groceryList: {}
    };
    $this.updateDatabase(data);
    $this.logIn(username);
    return $this.findUser[username];
  };
  
  $this.addGroceryItemsToUI = () => {
    const groceryList = $this.currentUser()
      .groceryList;
    const groceryListItems = groceriesListElement.querySelectorAll('li:not(.empty-message):not(#remaining-items-wrapper)');
    if (groceryListItems) {
      groceryListItems.forEach(listElement => listElement.parentNode.removeChild(listElement));
    }
    for (let key in groceryList) {
      $this.addGroceryItemToUIAndBindEvents(key, groceryList[key]);
    }
    $this.toggleEmptyMessage()
  };
  
  $this.addGroceryItemToUIAndBindEvents = (itemKey, groceryItem) => {
    let listElement = document.createElement("li");
    let listLabel = document.createElement("label");
    let listLabelCheckBox = document.createElement("input");
    let listLabelNameElement = document.createElement("span");
    let listLabelQuantityElement = document.createElement("span");
    let actionButtonsWrap = document.createElement("div");
    let editButton = document.createElement("button");
    let deleteButton = document.createElement("button");
    listElement.classList += "grocery-list-item";
    listElement.setAttribute("data-id", itemKey);
    listLabelCheckBox.type = "checkbox";
    listLabelCheckBox.name = "groceryItem";
    listLabelCheckBox.value = itemKey;
    listLabelNameElement.classList.add("item-name");
    listLabelQuantityElement.classList.add("item-quantity")
    actionButtonsWrap.classList.add("action-buttons");
    editButton.classList.add("btn", "edit");
    deleteButton.classList.add("btn", "delete");
    editButton.setAttribute("data-id", itemKey);
    deleteButton.setAttribute("data-id", itemKey);
    listLabelNameElement.innerHTML = groceryItem.itemName;
    listLabelQuantityElement.innerHTML = groceryItem.quantity;
    editButton.innerHTML = "Edit";
    deleteButton.innerHTML = "Delete";
    if (groceryItem.completed) {
      listLabelCheckBox.checked = groceryItem.completed;
      listElement.classList.add("completed");
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
      .addEventListener("change", function (event) {
        const targetElement = $select("single-element", ".grocery-list-item[data-id='" + this.value + "']");
        $this.toggleGroceryItemCompletedStatus(this.checked, this.value);
        if (this.checked) {
          targetElement.classList.add("completed");
        } else {
          targetElement.classList.remove("completed");
        }
      });
    listElement.querySelector(".btn.delete")
      .addEventListener("click", function (event) {
        const itemKey = this.dataset.id;
        $this.deleteGroceryItem(itemKey);
        $select("single-element", "#remaining-items-wrapper .remaining-items").innerText = $this.remainingItemCount();
      });
    
    listElement.querySelector(".btn.edit")
      .addEventListener("click", function (event) {
        const itemKey = this.dataset.id;
        $this.toggleEditForm(itemKey, "open");
      });
  };
  
  $this.updateGroceryItemUI = (itemKey) => {
    const groceryItem = $this.findGrocerylistItem(itemKey);
    const targetedGroceryItemElement = $select("single-element", `.grocery-list-item[data-id="${itemKey}"]`);
    targetedGroceryItemElement.querySelector(".item-name").innerHTML = groceryItem.itemName;
    targetedGroceryItemElement.querySelector(".item-quantity").innerHTML = groceryItem.quantity;
    $this.highlightElement(targetedGroceryItemElement);
  };
  
  $this.deleteGroceryItemFromUI = (itemKey) => {
    const groceryItem = $select("single-element", ".grocery-list-item[data-id='" + itemKey + "']");
    groceryItem.remove();
    $this.toggleEmptyMessage()
  };
  
  $this.toggleBreakingBadScreen = (toggle) => {
    switch (toggle) {
    case "open":
      breakingBadContainer.classList.remove("hide")
      breakingBadContainer.classList.remove("closed");
      document.body.classList.add("breaking-bad-active")
      break;
    case "close":
      breakingBadContainer.classList.add("closed");
      setTimeout(function () {
        breakingBadContainer.classList.add("hide")
        document.body.classList.remove("breaking-bad-active")
      }, 200)
      break;
    }
  };
  
  $this.toggleLoginScreen = (toggle) => {
    loginContainer.classList.toggle("close", toggle == "close");
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
      $select("id", "password").value = ''
      break;
    }
  }
  
  $this.toggleEditForm = (itemKey, toggle) => {
    switch (toggle) {
    case "open":
      const grocerylistItem = $this.findGrocerylistItem(itemKey);
      $select("id", "edit-item-name-input").value = grocerylistItem.itemName;
      $select("id", "edit-item-quantity-input").value = grocerylistItem.quantity;
      $select("id", "edit-item-button").setAttribute("data-id", itemKey);
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
    const emptyMessageDiv = groceriesListElement.querySelector("li.empty-message");
    const remainingItemsDiv = groceriesListElement.querySelector("li#remaining-items-wrapper");
    emptyMessageDiv.classList.toggle("hide", ($this.totalItemCount() > 0))
    remainingItemsDiv.classList.toggle("hide", ($this.totalItemCount() == 0))
  }
  
  $this.toggleGroceryScreen = (toggle) => {
    groceryScreen.classList.toggle("show", toggle == "open");
    $select("single-element", "#remaining-items-wrapper .remaining-items").innerText = app.remainingItemCount();
    $select("single-element", "#remaining-items-wrapper .total-items").innerText = $this.maxGroceryItems()
  };
  
  $this.toggleSettingsUI = (toggle) => {
    switch (toggle) {
    case "open":
      const currentUser = $this.currentUser();
      if (currentUser && currentUser.password) {
        $select("id", "old-password-prompt").classList.remove('hide')
      } else {
        $select("id", "old-password-prompt").classList.add('hide')
      }
      userSettingsElement.classList.remove("close");
      groceryScreen.classList.add("blurred")
      break;
    case "close":
      userSettingsElement.classList.add("close");
      groceryScreen.classList.remove("blurred")
      userSettingsElement.querySelectorAll(".form-control.has-error").forEach(element => {
        element.classList.remove('has-error')
      });
      $select("multiple-elements", "#current-password, #settings-password, #settings-password-confirmation").forEach(element => {
        element.value = ''
      });
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
  
  // Alerts & Notifications

  $this.showValidationMessage = (container, message) => {
    clearTimeout(window.validationTimeout);
    const alertElement = $select('single-element', `${container} .alert`);
    alertElement.classList.remove('show');
    $select('single-element', `${container} .alert .validation-message`).innerHTML = message;
    alertElement.classList.add('show');
    window.validationTimeout = setTimeout(function () {
      alertElement.classList.remove('show');
    }, 10000) // 10 seconds timeout 
  };

  $this.showNotification = (message) => {
    clearTimeout(window.notificationTimeout);
    const notificationElement = $select('single-element', ".notification");
    notificationElement.classList.remove('show');
    $select('single-element', `.notification .message`).innerHTML = message;
    notificationElement.classList.add('show');
    window.notificationTimeout = setTimeout(function () {
      notificationElement.classList.remove('show');
    }, 10000) // 10 seconds timeout 
  }
};

window.addEventListener("load", function () {
  window.app = new App();
  app.init();
  window.breakingBadContainer = $select("id", "breaking-bad");
  window.loginContainer = $select("id", "login");
  window.passwordPromptContainer = $select("id", "login-step-2");
  window.editFormContainer = $select("id", "edit-form");
  window.groceryScreen = $select("id", "grocery-list-wrapper");
  window.groceriesListElement = $select("id", "groceries-list");
  window.userSettingsElement = $select("id", "user-settings");
  
  $select("single-element", "#username")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        if (this.value.length == 0) {
          this.parentElement.lastElementChild.innerHTML = "Please enter your name"
          this.parentElement.classList.add("has-error")
        } else {
          this.parentElement.classList.remove("has-error")
          const foundUser = app.findUser(this.value);
          if (foundUser) {
            if (foundUser.password) {
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
  
  $select("single-element", "#password")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        if (this.value.length == 0) {
          this.parentElement.lastElementChild.innerHTML = "Please enter your password"
          this.parentElement.classList.add("has-error")
        } else {
          this.parentElement.classList.remove("has-error")
          const userInputPassword = this.value;
          const attemptingUserElement = passwordPromptContainer.querySelector(".attempter-user-name");
          const attemptingUser = attemptingUserElement.dataset.user;
          const user = app.findUser(attemptingUser);
          if (user) {
            if (userInputPassword == window.atob(user.password)) {
              app.togglePasswordPromptUI(attemptingUser, "close")
              app.logIn(user.name);
              app.toggleLoginScreen("close");
              app.toggleGroceryScreen("open");
              this.parentElement.classList.remove("has-error")
            } else {
              this.parentElement.lastElementChild.innerHTML = "Your password is incorrect"
              this.parentElement.classList.add("has-error")
            }
          }
        }
      }
    })
  
  $select("single-element", "#settings-password-confirmation")
    .addEventListener("keyup", function (event) {
      const passwordInput = $select("id", "settings-password");
      if ((passwordInput.value != "")) {
        if (passwordInput.value != this.value) {
          this.classList.add("has-error")
          this.classList.remove("no-error")
        } else {
          this.classList.remove("has-error")
          this.classList.add("no-error")
        }
      }
    });
  $select("multiple-elements", "#current-password, #settings-password, #settings-password-confirmation")
    .forEach(element => {
      element.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
          $select("single-element", "#save-password").click();
        }
      });
    });

  $select("single-element", "#save-password")
    .addEventListener("click", function (event) {
      const currentUser = app.currentUser();
      const oldPassword = $select("single-element", "#current-password");
      const newPassword = $select("single-element", "#settings-password");
      const confirmationPassword = $select("single-element", "#settings-password-confirmation");
      if (newPassword.value != "" && confirmationPassword.value != "") {
        if (currentUser.password) {
          if (app.isValidPassword(oldPassword.value)) {
            if (newPassword.value == confirmationPassword.value) {
              app.updateUserPassword(newPassword.value);
              updateActors()
              app.toggleSettingsUI("close");
            } else {
              app.showValidationMessage("#user-settings", "Your entered password and confirmation password doesn't match");
            }
          } else {
            app.showValidationMessage("#user-settings", "The Current password you entered is incorrect.");
          }
        } else {
          if (newPassword.value == confirmationPassword.value) {
            app.updateUserPassword(newPassword.value)
          } else {
            app.showValidationMessage("#user-settings", "Your entered password and confirmation password doesn't match");
          }
        }
      } else {
        app.showValidationMessage("#user-settings", "Please enter a password");
      }
    });
  
  $select("id", "item-name")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        $select("id", "add-item").click();
      }
    });
  
  $select("id", "item-quantity")
    .addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        $select("id", "add-item").click();
      }
    });
  
  $select("id", "add-item")
    .addEventListener("click", function (event) {
      const inputValueElement = $select("id", "item-name");
      const itemQuantityElement = $select("id", "item-quantity");
      if (inputValueElement.value.length == 0) {
        app.showValidationMessage("#new-item-form", "Please enter the item name");
      } else if (itemQuantityElement.value < 1) {
        app.showValidationMessage("#new-item-form", "Please enter the item quantity");
      } else if (app.isItemNameExists(inputValueElement.value)) {
        app.showValidationMessage("#new-item-form", "Item is already exists in your grocery list");
      } else {
        app.addGroceryItem(inputValueElement.value, itemQuantityElement.value);
        $select("single-element", "#remaining-items-wrapper .remaining-items").innerText = app.remainingItemCount();
        inputValueElement.value = "";
        itemQuantityElement.value = 1;
      }
    });
  
  $select("id", "change-password")
    .addEventListener("click", function (event) {
      app.toggleSettingsUI('open')
    })
  
  $select("id", "close-user-settings")
    .addEventListener("click", function (event) {
      app.toggleSettingsUI('close')
    })
  
  $select("id", "close-item-edit-form")
    .addEventListener("click", function (event) {
      app.toggleEditForm(null, 'close')
    })
  
  $select("id", "logout")
    .addEventListener("click", function (event) {
      app.logOut();
    });
  
  $select("multiple-elements", ".password-peek .emoji")
    .forEach(peekElement => {
      peekElement.addEventListener("click", function (event) {
        const parentElement = this.parentElement;
        switch (parentElement.dataset.status) {
        case "open":
          parentElement.querySelector('.emoji.closed').classList.add("show")
          parentElement.querySelector('.emoji.open').classList.remove("show")
          parentElement.setAttribute("data-status", "closed")
          parentElement.previousElementSibling.setAttribute("type", "password")
          break;
        case "closed":
          parentElement.querySelector('.emoji.closed').classList.remove("show")
          parentElement.querySelector('.emoji.open').classList.add("show")
          parentElement.setAttribute("data-status", "open")
          parentElement.previousElementSibling.setAttribute("type", "text")
          break;
        }
      });
    });
  
  $select("id", "menu-trigger")
    .addEventListener("click", function (event) {
      if (this.classList.contains('opened')) {
        this.classList.remove('opened')
        $select("id", "settings-menu")
          .classList.remove('opened')
      } else {
        this.classList.add('opened')
        $select("id", "settings-menu").classList.add('opened')
      }
    })
  
  $select("multiple-elements", ".actor").forEach(actorElement => {
    actorElement.addEventListener("click", function (event) {
      const $this = this;
      $select("multiple-elements", `.actor:not(#${$this.getAttribute("id")})`).forEach(element => {
        element.classList.add("disappear")
      });
      
      setTimeout(function () {
        $this.classList.add('selectedCharecter')
      }, 500);
      
      setTimeout(function () {
        app.toggleBreakingBadScreen('close')
        if ($this.id == "normal-user") {
          app.toggleLoginScreen("open");
        } else {
          app.togglePasswordPromptUI($this.dataset.username, "open")
        }
      }, 800);
    })
  });
  
  $select("multiple-elements", "#edit-item-name-input, #edit-item-quantity-input").forEach(element => {
      element.addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        $select("id", "edit-item-button").click();
      }
    })
  });
  
  $select("single-element", "#edit-item-button").addEventListener("click", function (event) {
    event.preventDefault();
    const itemKey = this.dataset.id;
    const updatedItemName = $select("id", "edit-item-name-input").value;
    const updatedItemQuantity = $select("id", "edit-item-quantity-input").value;
    if (updatedItemName == "") {
      app.showValidationMessage("#edit-form", "Please enter item name")
    } else if (updatedItemQuantity == "") {
      app.showValidationMessage("#edit-form", "Please enter item quantity")
    } else if (updatedItemQuantity == 0) {
      app.showValidationMessage("#edit-form", "Item quantity can't be zero.")
    } if (app.isItemNameExists(updatedItemName, itemKey)) {
      app.showValidationMessage("#edit-form", "Item is already exists in your grocery list");
    } else {
      app.updateGroceryItem(itemKey, updatedItemName, updatedItemQuantity);
      app.toggleEditForm(itemKey, "close");
      app.showNotification("Item updated successfully!!")
    }
  })
  
  $select("multiple-elements", ".go-back").forEach(element => {
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
          $select("multiple-elements", ".actor.disappear").forEach(actor => actor.classList.remove("disappear"))
          $select("single-element", ".actor.selectedCharecter").classList.remove("selectedCharecter");
        }, 90)
        break;
      }
    });
  });

  $select("multiple-elements", ".alert .close-icon, .notification .close-icon").forEach(closeIconElement => {
    closeIconElement.addEventListener("click", function (event) {
      clearTimeout(window.validationTimeout);
      this.parentElement.classList.remove("show");
    })
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
