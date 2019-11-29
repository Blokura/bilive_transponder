/*******************
 ****** index ******
 *******************/
/**
 * 应用设置
 *
 * @interface options
 */
interface options {
  server: server
  config: config
  user: userCollection
  newUserData: userData
  info: optionsInfo
}
interface server {
  path: string
  hostname: string
  port: number
  protocol: string
  netkey: string
}
interface config {
  [index: string]: number | boolean | string | string[]
  adminServerChan: string
  connectHash: string
  welcome: string
  raffle: boolean
  lottery: boolean
  pklottery: boolean
  beatStorm: boolean
}
interface userCollection {
  [index: string]: userData
}
interface userData {
  [index: string]: string | boolean
  status: boolean
  nickname: string
  serverURL: string
}
interface optionsInfo {
  [index: string]: configInfoData
  status: configInfoData
  connectHash: configInfoData
  welcome: configInfoData
  raffle: configInfoData
  lottery: configInfoData
  pklottery: configInfoData
  beatStorm: configInfoData
}
interface configInfoData {
  description: string
  tip: string
  type: string
  cognate?: string
}
/*******************
 ****** tools ******
 *******************/
/**
 * 客户端消息
 *
 * @interface systemMSG
 */
interface systemMSG {
  message: string
  options: options
}
/**
 * Server酱
 *
 * @interface serverChan
 */
interface serverChan {
  errno: number
  errmsg: string
  dataset: string
}
/*******************
 ** bilive_client **
 *******************/
/**
 * 消息格式
 *
 * @interface raffleMessage
 */
interface raffleMessage {
  cmd: 'raffle'
  roomID: number
  id: number
  type: string
  title: string
  time: number
  max_time: number
  time_wait: number
}
/**
 * 消息格式
 *
 * @interface lotteryMessage
 */
interface lotteryMessage {
  cmd: 'lottery' | 'pklottery'
  roomID: number
  id: number
  type: string
  title: string
  time: number
}
/**
 * 消息格式
 *
 * @interface beatStormMessage
 */
interface beatStormMessage {
  cmd: 'beatStorm'
  roomID: number
  id: number
  num: number
  type: string
  title: string
  time: number
}
/**
 * 消息格式
 *
 * @interface systemMessage
 */
interface systemMessage {
  cmd: 'sysmsg'
  msg: string
  ts?: string
}
type message = systemMessage | raffleMessage | lotteryMessage | beatStormMessage
/*******************
 ***** wsserver ****
 *******************/
/**
 * WebSocket消息
 *
 * @interface clientMessage
 */
interface adminMessage {
  cmd: string
  ts: string
  msg?: string
  uid?: string
  data?: config | optionsInfo | string[] | userData
}