const sqliteConnection = require("../../sqlite");
const CreateUsers = require("./CreateUsers");

async function migrationsRun() {
  const schemas = [CreateUsers].join("");

  sqliteConnection()
    .then((db) => db.exec(schemas))
    .catch((error) => console.error(error));
}

module.exports = migrationsRun;
