const snapshot = object => JSON.parse(JSON.stringify(object || null))

const genRandomFloat = (min, max, rand = Math.random) => rand() * (max - min) + min
const genRandomInt = (min, max, rand = Math.random) => Math.floor(rand() * (max - min + 1)) + min

const unCapitalize = string => string.replace(/\w\S*/g, word => word.charAt(0).toLowerCase() + word.substr(1))

export {snapshot, genRandomFloat, genRandomInt, unCapitalize}