const NinjaType = require('./ninja_type')
module.exports = class ScoreStorage {
  constructor (storage) {
    this.storage = storage
  }
  isEmpty (obj) {
    return !obj || Object.keys(obj).length === 0
  }
  /**
   * Get user data from storage
   * @param {String} id the user id
   */
  getUserData (id, type) {
    return new Promise((resolve, reject) => {
      this.storage.users.get(id, (err, data) => {
        console.log('getting existing data' + JSON.stringify(data))
        if (err || this.isEmpty(data)) reject(new Error(err)) // resolving here because the case where a user does not exist is valid.. and we dont want to reject
        else resolve(data)
      })
    }).catch(err => {
      console.log(`An error occured getting data of user/thing with id ${id}.
                   If this is the first time this user/thing is recieving a score,
                   this error is normal. Here is the error anyway:`)
      console.log(err)
      return this.saveUserData(id, {type}) // this might be the first time a user/thing gets a score, so we add the type here
    })
  }
  /**
   * Save user data to storage
   * @param {String} id the user id
   */
  saveUserData (id, data) {
    return new Promise((resolve, reject) => {
      const toSave = Object.assign({id}, data)
      this.storage.users.save(toSave, (err) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }
  /**
   * lookup all users and get the highest 5 users and 5 things
   */
  getHighestFive () {
    return new Promise((resolve, reject) => {
      this.storage.users.all((err, ninjas) => {
        if (err) reject(err)
        else {
          let users = []
          let things = []
          ninjas.forEach(ninja => {
            if (ninja.score) {
              if (ninja.type === NinjaType.user) users.push(ninja)
              else if (ninja.type === NinjaType.thing) things.push(ninja)
            }
          })
          users = users.sort((a, b) => b.score - a.score).slice(0, 5)
          things = things.sort((a, b) => b.score - a.score).slice(0, 5)
          resolve({users, things})
        }
      })
    })
  }
  /**
   * Saves the data and returns a promise that resolves to a score
   * @param {String} id the user id
   * @param {Object} data the data to store (includes score)
   */
  _setScore (id, data) {
    return this
      .saveUserData(id, data)
      .then(data => data.score)
  }
  /**
   * Add score to users existing score
   * @param {String} id the user id
   * @param {String} type (user, thing)
   * @param {Number} numToAddToScore the number to add to the existing score
   */
  _add (id, type, numToAddToScore) {
    return this
      .getUserData(id, type)
      .then(data => {
        const currentScore = (data && data.score) ? data.score : 0
        data = Object.assign({}, data, {score: currentScore + numToAddToScore})
        return this._setScore(id, data)
      })
  }
  /**
   * Add one to existing user/thing score
   * @param {String} id ther user/thing id
   * @param {String} type the type (user/thing)
   */
  plus (id, type) {
    return this._add(id, type, 1)
  }
  /**
   * minus one from existing user/thing score
   * @param {*} id ther user/thing  id
   * @param {String} type the type (user/thing)
   */
  minus (id, type) {
    return this._add(id, type, -1)
  }
}
