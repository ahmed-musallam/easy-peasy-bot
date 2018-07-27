let stringProto = String.prototype
Object.defineProperties(stringProto, {
  bold: {
    get: function () {
      return `*${this.trim()}*`
    }
  },
  quote: {
    get: function () {
      return `>${this.trim()}`
    }
  },
  italic: {
    get: function () {
      return `_${this.trim()}_`
    }
  },
  code: {
    get: function () {
      return `\`\${this.trim()}\``
    }
  },
  preformat: {
    get: function () {
      return `\`\`\`${this.trim()}\`\`\``
    }
  },
  strike: {
    get: function () {
      return `~${this.trim()}~`
    }
  },
  indent: {
    get: function () {
      return `  ${this.trim()}`
    }
  },
  mention: {
    get: function () {
      return `<@${this.trim()}>`
    }
  }
})

module.exports = class Message {
  constructor () {
    this.str = ''
  }
  add (newstr = '') {
    this.str += newstr
    return this
  }
  get () {
    return this.str
  }
  addLine (newstr = '') {
    const toAdd = '\n' + newstr
    this.str += toAdd
    return this
  }
  quote () {
    this.str = `${this.str}`.replace(/\n+/g, '\n>')
    return this
  }
}
