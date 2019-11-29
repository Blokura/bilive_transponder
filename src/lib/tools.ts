import util from 'util'
import crypto from 'crypto'
import request from 'request'
import { EventEmitter } from 'events'
import Options from '../options'
/**
 * 一些工具, 供全局调用
 *
 * @class Tools
 * @extends EventEmitter
 */
class Tools extends EventEmitter {
  constructor() {
    super()
    this.on('systemMSG', (data: systemMSG) => this.Log(data.message))
  }
  /**
   * 格式化JSON
   *
   * @template T
   * @param {string} text
   * @param {((key: any, value: any) => any)} [reviver]
   * @returns {(Promise<T | undefined>)}
   * @memberof tools
   */
  public JSONparse<T>(text: string, reviver?: ((key: any, value: any) => any)): Promise<T | undefined> {
    return new Promise<T | undefined>(resolve => {
      try {
        const obj = JSON.parse(text, reviver)
        return resolve(obj)
      }
      catch (error) {
        this.ErrorLog('JSONparse', error)
        return resolve()
      }
    })
  }
  /**
   * Hash
   *
   * @param {string} algorithm
   * @param {(string | Buffer)} data
   * @returns {string}
   * @memberof tools
   */
  public Hash(algorithm: string, data: string | Buffer): string {
    return crypto.createHash(algorithm).update(data).digest('hex')
  }
  /**
   * 当前系统时间
   *
   * @returns {string}
   * @memberof Tools
   */
  public Date(): string {
    return new Date().toString().slice(4, 24)
  }
  /**
   * 格式化输出, 配合PM2凑合用
   *
   * @param {...any[]} message
   * @memberof tools
   */
  public Log(...message: any[]) {
    const log = util.format(`${this.Date()} :`, ...message)
    if (this.logs.length > 500) this.logs.shift()
    this.emit('log', log)
    this.logs.push(log)
    console.log(log)
  }
  public logs: string[] = []
  /**
   * 格式化输出, 配合PM2凑合用
   *
   * @param {...any[]} message
   * @memberof tools
   */
  public ErrorLog(...message: any[]) {
    console.error(`${this.Date()} :`, ...message)
  }
  /**
   * sleep
   *
   * @param {number} ms
   * @returns {Promise<'sleep'>}
   * @memberof tools
   */
  public Sleep(ms: number): Promise<'sleep'> {
    return new Promise<'sleep'>(resolve => setTimeout(() => resolve('sleep'), ms))
  }
  /**
   * 为了兼容旧版
   *
   * @param {string} message
   * @memberof Tools
   */
  public sendSCMSG(message: string) {
    const adminServerChan = Options._.config.adminServerChan
    if (adminServerChan !== '') {
      request({
        method: 'POST',
        uri: `https://sc.ftqq.com/${adminServerChan}.send`,
        body: `text=bilive_transponder&desp=${message}`,
        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
      })
    }
  }
  /**
   * 异或加密
   *
   * @param {string} key
   * @param {string} input
   * @returns {string}
   */
  public static xorStrings(key: string, input: string): string {
    let output: string = ''
    for (let i = 0, len = input.length; i < len; i++) {
      output += String.fromCharCode(
        input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return output
  }
  public B64XorCipher = {
    encode(key: string, data: string): string {
      return (data && data !== '' && key !== '') ? Buffer.from(Tools.xorStrings(key, data), 'utf8').toString('base64') : data
    },
    decode(key: string, data: string): string {
      return (data && data !== '' && key !== '') ? Tools.xorStrings(key, Buffer.from(data, 'base64').toString('utf8')) : data
    }
  }
}

export default new Tools()
