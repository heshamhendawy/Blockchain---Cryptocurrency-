"use strict";

class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log("...");
  }
}

class Cat extends Animal {
  constructor(name, favoriteFood) {
    super(name);
    this.favoriteFood = favoriteFood;
  }
  speak() {
    console.log('Meow');
  }
  eat(food) {
    // Don't forget 'this'.  Also, ALWAYS use === instead of ==.
    if (this.favoriteFood === food) {
      console.log("Purr...");
    }
    console.log("munch, munch, munch");
  }
}

let garfield = new Cat("Garfield", "lasagna");

garfield.speak();
console.log(garfield.favoriteFood);

garfield.eat("chicken");
garfield.eat("lasagna");

class Fish extends Animal {
  constructor(name) {
    super(name);
  }
}

let frankie = new Fish("Frankie");
frankie.speak();