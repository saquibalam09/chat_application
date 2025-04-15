import { User } from "../models/user.models.js";
import { faker } from "@faker-js/faker";
import { USERS_COUNT } from "./_constant.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Array of fake users
const users = new Array(USERS_COUNT).fill("_").map(() => ({
  avatar: {
    url: faker.image.avatar(),
    localPath: "",
  },
  username: faker.internet.username(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  isEmailVerified: true,
  // role: AvailableUserRoles[getRandomNumber(2)],
}));

/**
 * @description Seeding middleware for users api which other api services can use which are dependent on users
 */
const seedUsers = asyncHandler(async (req, res, next) => {
  const userCount = await User.count();
  if (userCount >= USERS_COUNT) {
    // Don't re-generate the users if we already have them in the database
    next();
    return;
  }
  await User.deleteMany({}); // delete all the existing users from previous seedings

  // remove cred json
  removeLocalFile("./public/temp/seed-credentials.json"); // remove old credentials

  const credentials = [];

  // create Promise array
  const userCreationPromise = users.map(async (user) => {
    credentials.push({
      username: user.username.toLowerCase(),
      password: user.password,
      role: user.role,
    });
    await User.create(user);
  });

  // pass promises array to the Promise.all method
  await Promise.all(userCreationPromise);

  // Once users are created dump the credentials to the json file
  const json = JSON.stringify(credentials);

  fs.writeFileSync(
    "./public/temp/seed-credentials.json",
    json,
    "utf8",
    (err) => {
      logger.error("Error while writing the credentials", err);
    }
  );

  // proceed with the request
  next();
});

export { seedUsers };
