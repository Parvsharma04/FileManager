const serveIndex = require('serve-index')

module.exports = function auth(req, res, next) {
  // console.log(req.session)
  if (req.session.user === req.params.username) {
    next();
  } else if (req.params.username != req.session.user)
    res.redirect("/");
  else {
    res.redirect("/");
  }
};


module.exports = function serve(req, res, next) {
  serveIndex(`/uploads/${req.session.user}`, { icons: true })(req, res, next);
}