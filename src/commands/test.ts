import {Command, Flags} from '@oclif/core'
import axios from 'axios'

export default class Load extends Command {
  static description = 'load test site'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    concurrency: Flags.integer({ char: 'c', default: 1, description: 'Concurrency' }),
    num: Flags.integer({ char: 'n', default: 1, description: 'Num of reqs' }),
    url: Flags.string({ char: 'u', description: 'URL' }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Load)

    const { concurrency, num, url } = flags;

    if (!url) throw new Error('Missing URL')

    const u = new URL(url)

    if (u.protocol !== 'https:') {
      throw new Error('Not implemented')
    }
    
    this.log('Testing:', url)

    // if making 1 request, don't worry about loops or concurrency
    if (num === 1) {
      const test = await this.makeHttpRequest(url);
      this.log('Status Code: ', test.statusCode)
    }

    // if concurreny is 1 then we don't need to worry about building arrays of arrays
    if (concurrency === 1) {
      // eslint-disable-next-line unicorn/new-for-builtins
      const nRequests = Array(num).fill(await this.makeHttpRequest(url))
    
      for (const r of nRequests) {
        this.log('Status Code: ', r.statusCode)
      }

      return
    }

    // build arrays of arrays
    const requestGroupSize = Math.round(num / concurrency)

    const concurrentRequests = async (url: string) => 
      // eslint-disable-next-line unicorn/new-for-builtins
      Array(requestGroupSize).fill(await this.makeHttpRequest(url))
    
    const results = await Promise.all(
      // eslint-disable-next-line unicorn/new-for-builtins
      Array(concurrency).fill(await concurrentRequests(url))
    )

    let successess = 0
    let failures = 0

    for (const group of results) {
      
      for (const r of group) {
      
        if (Number(r.statusCode) >= 200 || Number(r.statusCode) < 300) {
          successess++
        } else {
          failures++
        }
      }
    }
    
    console.log('Successes:', successess)
    console.log('Failures:', failures)
  }

  private async makeHttpRequest(url: string) {
    const req = await axios.get(url)
    return {
      statusCode: req.status,
      timeToFirstByte: 0,
      timeToLastByte: 0,
      totalTimeForRequest: 0,
    }
  }
}
