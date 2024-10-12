const express = require("express");
const fs = require("fs");
const session = require("express-session");
const auth = require("./middleware");
const serve = require("./middleware");
const multer = require("multer");
const path = require("path");
const serveIndex = require("serve-index");
const app = express();
const port = 8080;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, `/public/uploads/${req.session.user}`);
    fs.mkdir(userDir, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
        return cb(err);
      }
      cb(null, userDir);
    });
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  session({
    saveUninitialized: false,
    secret: "thisIsASecret",
    resave: false,
  })
);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("./login");
});

app.post("/login", (req, res) => {
  fs.readFile("users.json", (err, data) => {
    if (!err) {
      const users = JSON.parse(data);
      let userFound = users.find(
        (ele) =>
          ele.username === req.body.username &&
          ele.password === req.body.password
      );

      if (userFound) {
        req.session.user = req.body.username;
        res.redirect(`/dash/${req.body.username}`);
      } else {
        res.json({ msg: "User does not exist, Signup" });
      }
    }
  });
});

app.get("/signup", (req, res) => {
  res.render("./signup");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (password.length < 8) {
    return res
      .status(400)
      .json({ msg: "Password should be at least 8 characters" });
  }

  try {
    const data = await fs.promises.readFile("users.json");
    const users = JSON.parse(data);
    const userFound = users.find((ele) => ele.username === username);

    if (!userFound) {
      users.push({ username, password });
      await fs.promises.mkdir(__dirname + `/public/uploads/${username}`, {
        recursive: true,
      });
      await fs.promises.writeFile("users.json", JSON.stringify(users));
      req.session.user = username;
      return res.redirect(`/dash/${username}`);
    } else {
      return res
        .status(400)
        .json({ msg: "User already exists, please log in" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error destroying session");
    }
  });
  res.redirect("/");
});

app.get("/dash/:username", auth, (req, res) => {
  res.render("dash", { username: req.params.username });
});

app.post("/upload", upload.single("doc"), (req, res) => {
  if (!req.session.user) {
    return res.status(403).send("User not authenticated");
  }

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  // console.log(req.file);
  res.send("File uploaded successfully");
});

app.get("/files", (req, res, next) => {
  if (!req.session.user) {
    return res.status(403).send("User not authenticated");
  }

  const userDir = path.join(__dirname, "public/uploads", req.session.user);

  app.use(`/uploads/${req.session.user}`, express.static(userDir));

  app.use(`/uploads/${req.session.user}`, serveIndex(userDir, { icons: true }));

  res.redirect(`/uploads/${req.session.user}`);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
