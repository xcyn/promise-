// 状态
const SUCCESS = 'success'
const ERROR = 'error'
const PENDING = 'pending'

function MP(callBack) {
  this.status = PENDING
  // 成功回调
  this.successCks = []
  // 失败回调
  this.errorCks = []
  let that = this
  // reslove实现
  this.resolve = function (data) {
    that.status = SUCCESS
    if(that.successCks && that.successCks.length) {
      for(let k in that.successCks) {
        let cb = that.successCks[k]
        cb(data)
      }
    }
    return data
  }
  // reject实现
  this.reject = function (err) {
    that.status = ERROR
    if(that.errorCks && that.errorCks.length) {
      for(let k in that.errorCks) {
        let cb = that.errorCks[k]
        cb(err)
      }
    }
    return err
  }
  // 立即执行当前Promise中的同步代码
  try {
    callBack(this.resolve, this.reject)
  } catch (error) {
    this.reject()
  }
}

MP.prototype.then = function (successCk, errorCk) {
  let that = this
  if(!successCk || successCk === undefined) {
    successCk = function (data) {
      return data
    }
  }
  if(!errorCk || errorCk === undefined) {
    errorCk = function (err) {
      return err
    }
  }
  return new Promise((reslove, reject) => {
    if(that.status === SUCCESS) {
      const res = that.resolve()
      successCk(res)
    } else if(that.status === ERROR) {
      const res = that.reject()
      errorCk(res)
    } else if(that.status === PENDING) {
      function handleSuccess(successdata) {
        const res = successCk(successdata)
        reslove(res)
      }
      function handleError(errData) {
        const res = errorCk(errData)
        reject(res)
      }
      that.successCks.push(handleSuccess)
      that.errorCks.push(handleError)
    } else {
      throw new Error('状态有误')
    }
  })
}

MP.prototype.catch = function (errorck) {
  return this.then(undefined, errorck)
}

MP.prototype.all = function (ps) {
  let arr = []
  return new MP((resolve, reject) => {
    for(let k in ps) {
      let p = ps[k]
      p.then((res) => {
        arr.push(res)
      }).catch( err => {
        reject(err)
      })
    }
    resolve(arr)
  })
}

MP.prototype.race = function (ps) {
  return new MP((resolve, reject) => {
    for(let k in ps) {
      let p = ps[k]
      p.then((res) => {
        resolve(res)
      }).catch( err => {
        reject(err)
      })
    }
  })
}

MP.prototype.finally = function (fnCk) {
  return this.then((res) => {
    return new MP(resolve => {
      resolve(res)
    })
  }, (err) => {
    return new MP(resolve => {
      resolve(fnCk(err))
    })
  })
}

const a = new MP((reslove, reject) => {
  console.log('测试promise')
  setTimeout(() => {
    try {
      console.log('setTimeout: 1s')
      reslove('1s')
    } catch (error) {
      reject(error)
    }
  }, 1000);
}).then(data => {
  console.log('data', data)
  return '2s'
}).then(data => {
  throw new Error('状态有误')
  console.log('data', data)
  return '3s'
}).catch(err => {
  console.log('error', err)
})