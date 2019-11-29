import tools from './lib/tools'
import Client from './lib/client'
/**
 * 客户端, 可自动重连
 *
 * @class ClientRE
 * @extends {Client}
 */
class ClientRE extends Client {
  /**
   * Creates an instance of ClientRE.
   * @param {string} server
   * @param {string} protocol
   * @memberof Client
   */
  constructor(server: string, protocol: string) {
    super(server, protocol)
    this.on('clientError', error => tools.ErrorLog(error))
    this.on('close', () => this._ClientReConnect())
  }
  /**
   * 重连次数, 以十次为阈值
   *
   * @type {number}
   * @memberof ClientRE
   */
  public reConnectTime: number = 0
  private _update: boolean = false
  /**
   * 更新服务器地址
   *
   * @param string
   * @memberof ClientRE
   */
  public Update(url: string) {
    this._update = true
    const { 0: server, 1: protocol } = url.split('#')
    if (protocol !== undefined && protocol !== '') {
      this._server = server
      this._protocol = protocol
      this.Close()
      this.Connect()
    }
    else this.Close()
  }
  /**
   * 重新连接
   *
   * @private
   * @memberof ClientRE
   */
  private _ClientReConnect() {
    if (this._update) this._update = false
    else {
      this._Timer = setTimeout(async () => {
        if (this.reConnectTime >= 10) {
          this.reConnectTime = 0
          this._DelayReConnect()
        }
        else {
          this.reConnectTime++
          this.Connect()
        }
        await tools.Sleep(1000)
      }, 10 * 1000)
    }
  }
  /**
   * 5分钟后重新连接
   *
   * @private
   * @memberof ClientRE
   */
  private _DelayReConnect() {
    this._Timer = setTimeout(() => this.Connect(), 60 * 1000)
    tools.ErrorLog('重连ws服务器失败，一分钟后继续尝试')
  }
}
export default ClientRE
