import { EventEmitter } from 'events'
import tools from './lib/tools'
import Client from './client_re'
import Options from './options'
/**
 * 监听服务器消息
 *
 * @class Listener
 * @extends {EventEmitter}
 */
class Listener extends EventEmitter {
  constructor() {
    super()
  }
  /**
   * 用于接收WS服务器消息
   *
   * @private
   * @type {Map<string, DMclient>}
   * @memberof Listener
   */
  private _WSClients: Map<string, Client> = new Map()
  /**
   * 抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _raffleID: Set<number> = new Set()
  private _dailyRaffleID: Set<number> = new Set()
  /**
   * 快速抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _lotteryID: Set<number> = new Set()
  private _dailyLotteryID: Set<number> = new Set()
  /**
   * 节奏风暴ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _beatStormID: Set<number> = new Set()
  private _dailyBeatStormID: Set<number> = new Set()
  /**
   * PK大乱斗ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _pklotteryID: Set<number> = new Set()
  /**
   * PK大乱斗ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _anchorID: Set<number> = new Set()
  private _dailyAnchorID: Set<number> = new Set()
  /**
   * 开始监听时间
   *
   * @private
   * @type {number}
   * @memberof Listener
   */
  private _ListenStartTime: number = Date.now()
  /**
   * 消息缓存
   *
   * @private
   * @type {Set<string>}
   * @memberof Listener
   */
  public _MSGCache: Set<string> = new Set()
  /**
   * 抽奖更新时间
   *
   * @private
   * @type {number}
   * @memberof Listener
   */
  private _lastUpdate: number = Date.now()
  // @ts-ignore
  private _loop: NodeJS.Timer
  /**
   * 开始监听
   *
   * @memberof Listener
   */
  public Start() {
    this.connectWSServer()
    // 3s清空一次消息缓存
    this._loop = setInterval(() => this._MSGCache.clear(), 3 * 1000)
  }
  /**
   * 更新分区房间
   *
   * @memberof Listener
   */
  private connectWSServer() {
    for (const uid in Options._.user) {
      if (!Options._.user[uid].status) continue
      const { 0: server, 1: protocol } = Options._.user[uid].serverURL.split('#')
      if (server !== undefined && protocol !== undefined) {
        if (this._WSClients.get(uid) !== undefined) continue
        let nickname = Options._.user[uid].nickname
        let client = new Client(server, protocol)
        client
          .on('raffle', (raffleMessage: raffleMessage) => this._RaffleHandler(raffleMessage))
          .on('lottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
          .on('pklottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
          .on('beatStorm', (beatStormMessage: beatStormMessage) => this._RaffleHandler(beatStormMessage))
          .on('anchor', (anchorMessage: anchorMessage) => this._RaffleHandler(anchorMessage))
          .on('sysmsg', (systemMessage: systemMessage) => tools.Log(`来自${nickname} 的消息：${systemMessage.msg}`))
          .Connect()
        this._WSClients.set(uid, client)
        tools.Log(`已连接到 ${Options._.user[uid].serverURL}`)
      }
    }
    Options.on('connectClient', uid => {
      const { 0: server, 1: protocol } = Options._.user[uid].serverURL.split('#')
      if (server !== undefined && protocol !== undefined) {
        if (this._WSClients.get(uid) !== undefined) return
        let nickname = Options._.user[uid].nickname
        let client = new Client(server, protocol)
        client
          .on('raffle', (raffleMessage: raffleMessage) => this._RaffleHandler(raffleMessage))
          .on('lottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
          .on('pklottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
          .on('beatStorm', (beatStormMessage: beatStormMessage) => this._RaffleHandler(beatStormMessage))
          .on('anchor', (anchorMessage: anchorMessage) => this._RaffleHandler(anchorMessage))
          .on('sysmsg', (systemMessage: systemMessage) => tools.Log(`来自${nickname}的消息：${systemMessage.msg}`))
          .Connect()
        this._WSClients.set(uid, client)
        tools.Log(`已连接到 ${Options._.user[uid].serverURL}`)
      }
    })
    Options.on('disconnectClient', uid => {
      if (this._WSClients.get(uid) === undefined) return
      let client = <Client>this._WSClients.get(uid)
      client
        .removeAllListeners()
        .Close()
      this._WSClients.delete(uid)
      tools.Log(`${Options._.user[uid].serverURL} 连接已断开`)
    })
  }
  /**
   * 清空所有ID缓存
   *
   * @memberof Listener
   */
  public clearAllID() {
    if (Date.now() - this._lastUpdate < 3 * 60 * 1000) return
    this._raffleID.clear()
    this._lotteryID.clear()
    this._pklotteryID.clear()
    this._beatStormID.clear()
  }
  /**
   * 计算遗漏数量
   *
   * @private
   * @param {Set<number>} Set1
   * @param {Set<number>} Set2
   * @memberof Listener
   */
  private getMisses(Set1: Set<number>, Set2?: Set<number>) {
    let query1 = [...Set1]
    let query2 = Set2 === undefined ? [] : [...Set2]
    if (query2.length > 0 && query2[0].toString().length > 6) // For beatStorm IDs
      for (let i = 0; i < query2.length; i++) query2[i] = Number(query2[i].toString().slice(0, -6))
    let query = query1.concat(query2).sort(function(a, b){return a - b})
    let Start: number = 0
    let End: number = 0
    if (query.length > 0) {
      Start = query[0]
      End = query[query.length-1]
    }
    let Misses = End - Start + 1 - query.length
    if (query.length === 0) Misses -= 1
    return Misses
  }
  /**
   * 监听数据Log
   *
   * @param {number} int
   * @memberof Listener
   */
  public logAllID(int: number) {
    const raffleMiss = this.getMisses(this._raffleID)
    const lotteryMiss = this.getMisses(this._lotteryID, this._beatStormID)
    const dailyRaffleMiss = this.getMisses(this._dailyRaffleID)
    const dailyLotteryMiss = this.getMisses(this._dailyLotteryID, this._dailyBeatStormID)
    const allRaffle = raffleMiss + this._raffleID.size
    const allLottery = lotteryMiss + this._lotteryID.size + this._beatStormID.size
    const dailyAllRaffle = dailyRaffleMiss + this._dailyRaffleID.size
    const dailyAllLottery = dailyLotteryMiss + this._dailyLotteryID.size + this._dailyBeatStormID.size
    const raffleMissRate = 100 * raffleMiss / (allRaffle === 0 ? 1 : allRaffle)
    const lotteryMissRate = 100 * lotteryMiss / (allLottery === 0 ? 1 : allLottery)
    const dailyRaffleMissRate = 100 * dailyRaffleMiss / (dailyAllRaffle === 0 ? 1 : dailyAllRaffle)
    const dailyLotteryMissRate = 100 * dailyLotteryMiss / (dailyAllLottery === 0 ? 1 : dailyAllLottery)
    let logMsg: string = '\n'
    logMsg += `/********************************* 运行信息 *********************************/\n`
    logMsg += `本次监听开始于：${new Date(this._ListenStartTime).toString()}\n`
    logMsg += `共监听到raffle抽奖数：${this._raffleID.size}(${this._dailyRaffleID.size})\n`
    logMsg += `共监听到lottery抽奖数：${this._lotteryID.size}(${this._dailyLotteryID.size})\n`
    logMsg += `共监听到beatStorm抽奖数：${this._beatStormID.size}(${this._dailyBeatStormID.size})\n`
    logMsg += `共监听到beatStorm抽奖数：${this._anchorID.size}(${this._dailyAnchorID.size})\n`
    logMsg += `raffle漏监听：${raffleMiss}(${raffleMissRate.toFixed(1)}%)\n`
    logMsg += `lottery漏监听：${lotteryMiss}(${lotteryMissRate.toFixed(1)}%)\n`
    logMsg += `今日raffle漏监听：${dailyRaffleMiss}(${dailyRaffleMissRate.toFixed(1)}%)\n`
    logMsg += `今日lottery漏监听：${dailyLotteryMiss}(${dailyLotteryMissRate.toFixed(1)}%)\n`
    tools.Log(logMsg)
    let pushMsg: string = ''
    pushMsg += `# 监听情况报告\n`
    pushMsg += `- 本次监听开始于：${new Date(this._ListenStartTime).toString()}\n`
    pushMsg += `- 共监听到raffle抽奖数：${this._raffleID.size}(${this._dailyRaffleID.size})\n`
    pushMsg += `- 共监听到lottery抽奖数：${this._lotteryID.size}(${this._dailyLotteryID.size})\n`
    pushMsg += `- 共监听到beatStorm抽奖数：${this._beatStormID.size}(${this._dailyBeatStormID.size})\n`
    pushMsg += `- 共监听到anchor抽奖数：${this._anchorID.size}(${this._dailyAnchorID.size})\n`
    pushMsg += `- raffle漏监听：${raffleMiss}(${raffleMissRate.toFixed(1)}%)\n`
    pushMsg += `- lottery漏监听：${lotteryMiss}(${lotteryMissRate.toFixed(1)}%)\n`
    pushMsg += `- 今日raffle漏监听：${dailyRaffleMiss}(${dailyRaffleMissRate.toFixed(1)}%)\n`
    pushMsg += `- 今日lottery漏监听：${dailyLotteryMiss}(${dailyLotteryMissRate.toFixed(1)}%)\n`
    if (int % 8 === 0) tools.sendSCMSG(pushMsg)
  }
  /**
   * 监听抽奖消息
   *
   * @private
   * @param {raffleMessage | lotteryMessage | beatStormMessage} raffleMessage
   * @memberof Listener
   */
  private _RaffleHandler(raffleMessage: raffleMessage | lotteryMessage | beatStormMessage | anchorMessage) {
    const { cmd, id, roomID, title } = raffleMessage
    switch (cmd) {
      case 'raffle':
        if (this._raffleID.has(id)) return
        this._raffleID.add(id)
        break
      case 'lottery':
        if (this._lotteryID.has(id)) return
        this._lotteryID.add(id)
        break
      case 'beatStorm':
        if (this._beatStormID.has(id)) return
        this._beatStormID.add(id)
        break
      case 'pklottery':
        if (this._pklotteryID.has(id)) return
        this._pklotteryID.add(id)
        break
      case 'anchor':
        if (this._anchorID.has(id)) return
        this._anchorID.add(id)
        break
      default: return
    }
    // 更新时间
    this._lastUpdate = Date.now()
    this.emit(cmd, raffleMessage)
    tools.Log(`房间 ${roomID} 开启了第 ${id} 轮${title}`)
  }
}

export default Listener
