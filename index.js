function encode(string) {
  return btoa(string);
}

function decode(string) {
  console.log(string);
  return atob(string);
}

function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

const SPACE = " ";

const INCORRECT = "⬛";
const CORRECT = "🟩";
const CLOSE = "🟨";
const NONE = "▪";

class Square {
  constructor(parent, phrase, character) {
    this.parent = parent;
    this.phrase = phrase;
    this.character = character;
    this.guess = '';
    this.entity = '';
    this.build();
  }

  build() {
    this.root = document.createElement("span");
    this.root.classList.add("square");
    this.root.classList.add(this.character === SPACE ? "space" : "letter");
    this.parent.appendChild(this.root);
  }

  select() {
    this.root.classList.add("selected");
  }

  deselect() {
    this.root.classList.remove("selected");
  }

  type(character) {
    this.guess = this.root.innerText = character;
  }

  backspace() {
    this.guess = this.root.innerText = '';
  }

  enter() {
    if (this.character !== SPACE) {
      if (this.guess === this.character) {
        this.root.classList.add("correct");
        this.entity = CORRECT;
        return true;
      } else if (this.phrase.indexOf(this.guess) !== -1) {
        this.root.classList.add("close");
        this.entity = CLOSE;
        return false;
      } else {
        this.root.classList.add("incorrect");
        this.entity = INCORRECT;
        return false;
      }
    } else {
      this.entity = NONE;
      return true;
    }
  }
}

class Row {
  constructor(parent, phrase) {
    this.parent = parent;
    this.phrase = phrase;
    this.squares = [];
    this.cursor = 0;
    this.build();
  }

  build() {
    this.root = document.createElement("div");
    this.root.classList.add("row");
    for (const character of this.phrase) {
      this.squares.push(new Square(this.root, this.phrase, character));
    }
    this.parent.appendChild(this.root);
    this.squares[0].select();
  }

  type(character) {
    if (this.cursor < this.squares.length) {
      if (character !== SPACE) {
        this.squares[this.cursor].type(character);
        this.squares[this.cursor].deselect();
        do {
          this.cursor += 1;
        } while (this.cursor < this.squares.length && this.squares[this.cursor].character === SPACE);
        if (this.cursor < this.squares.length) {
          this.squares[this.cursor].select();
        }
      }
    }
  }

  backspace() {
    if (this.cursor > 0) {
      if (this.cursor < this.squares.length) {
        this.squares[this.cursor].deselect();
      }
      do {
        this.cursor -= 1;
      } while (this.squares[this.cursor].character === SPACE);
      this.squares[this.cursor].select();
      this.squares[this.cursor].backspace();
    }
  }

  enter() {
    if (this.cursor === this.squares.length) {
      let correct = true;
      for (const square of this.squares) {
        const result = square.enter();
        correct &&= result;
      }
      return correct;
    } else {
      return null;
    }
  }
}

class Board {
  constructor(root, phrase) {
    this.root = root;
    this.phrase = phrase;
    this.rows = [];
    this.build();
  }

  build() {
    clear(this.root);
    this.rows.push(new Row(this.root, this.phrase));
  }

  type(letter) {
    this.rows[this.rows.length - 1].type(letter);
  }

  backspace() {
    this.rows[this.rows.length - 1].backspace();
  }

  enter() {
    const correct = this.rows[this.rows.length - 1].enter();
    if (correct === false) {
      this.rows.push(new Row(this.root, this.phrase));
    } else if (correct === true) {
      document.getElementById("message").innerText = `solved in ${this.rows.length} guess${this.rows.length > 1 ? "es" : ""}!`;
      document.getElementById("result").classList.remove("hidden");
    }
  }

  summarize() {
    let result = `${location}\n`;
    for (const row of this.rows) {
      for (const square of row.squares) {
        result += square.entity;
      }
      result += "\n";
    }
    return result.trim();
  }
}

function* query() {
  for (const pair of location.search.substring(1).split("&")) {
    yield pair.split("=", 2).map(decodeURIComponent);
  }
}

function get() {
  for (const [key, value] of query()) {
    if (key === "phrase") {
      try {
        return decode(value);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function validate() {
  document.getElementById("url").disabled = !document.getElementById("phrase").value.match(/^[a-zA-Z ]+$/);
}

window.addEventListener("load", () => {
  const phrase = get();
  if (phrase === null) {
    const error = document.getElementById("error");
    error.innerText = "invalid or missing phrase!"
    error.classList.remove("hidden");
  } else {
    const board = new Board(document.getElementById("board"), phrase);
    document.addEventListener("keydown", (event) => {
      if (document.activeElement !== document.body) {
        return;
      }
      if (event.key === "Backspace") {
        board.backspace();
      } else if (event.key === "Enter") {
        board.enter();
      } else if (event.key.length === 1) {
        if (event.key.match(/[a-z]/i)) {
          board.type(event.key.toLowerCase());
        }
      }
    });
    document.getElementById("copy").addEventListener("click", () => {
      navigator.clipboard
        .writeText(board.summarize())
        .then(() => console.log("copied successfully!"));
    })
  }

  document.getElementById("url").addEventListener("click", () => {
    const phrase = document.getElementById("phrase").value;
    navigator.clipboard
      .writeText(`${location.protocol}//${location.host}${location.pathname}?phrase=${encodeURIComponent(encode(phrase.toLowerCase()))}`)
      .then(() => console.log("copied successfully!"));
  });

  validate();
  document.getElementById("phrase").addEventListener("input", validate);
});
