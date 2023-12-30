import {Command, Flags} from '@oclif/core'
import got from 'got'

interface NetworkResponse {
  startTime: number
  statusCode: number
  timeToFirstByte: number
  timeToLastByte: number
  totalTimeForRequest: number
}

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

    // Needs to refactor
    const results = await Promise.all(
      // eslint-disable-next-line unicorn/new-for-builtins
      Array(concurrency).fill(await concurrentRequests(url))
    )

    let successess = 0
    let failures = 0

    let timeToFirstByteMeanCounter = 0
    let timeToLastByteMeanCounter = 0
    let timeToLastTotalMeanCounter = 0
    
    const timeToFirstByteValues = { Max: 0, Mean: 0, Min: 0 }
    const timeToLastByteValues = { Max: 0, Mean: 0, Min: 0 }
    const timeToTotalValues = { Max: 0, Mean: 0, Min: 0 }

    for (const group of results) {
      for (const r of group as NetworkResponse[]) {
        if (Number(r.statusCode) >= 200 || Number(r.statusCode) < 300) {
          successess++
        } else if (Number(r.statusCode) >= 500 || Number(r.statusCode) < 600) {
          failures++
        }

        // Total time
        timeToTotalValues.Max = timeToTotalValues.Max > r.totalTimeForRequest ? timeToTotalValues.Max : r.totalTimeForRequest
        timeToTotalValues.Min = timeToTotalValues.Min > r.totalTimeForRequest ? timeToTotalValues.Min : r.totalTimeForRequest
        timeToLastTotalMeanCounter += r.totalTimeForRequest
        
        // Time to first
        timeToFirstByteValues.Max = timeToFirstByteValues.Max > r.timeToFirstByte ? timeToFirstByteValues.Max : r.timeToFirstByte
        timeToFirstByteValues.Min = timeToFirstByteValues.Min > r.timeToFirstByte ? timeToFirstByteValues.Min : r.timeToFirstByte
        timeToFirstByteMeanCounter += r.timeToFirstByte
        
        
        // Time to last
        timeToLastByteValues.Max = timeToLastByteValues.Max > r.timeToLastByte ? timeToLastByteValues.Max : r.timeToLastByte
        timeToLastByteValues.Min = timeToLastByteValues.Min > r.timeToLastByte ? timeToLastByteValues.Min : r.timeToLastByte
        timeToLastByteMeanCounter += r.timeToLastByte
      }
    }


    console.log(`
      Results:
        Total Requests (2XX).......................: ${successess}
        Failed Requests (5XX)......................: ${failures}
        Request/second.............................: **

        Total Request Time (ms) (Min, Max, Mean).....: ${timeToTotalValues.Min}, ${timeToTotalValues.Max}, ${timeToLastTotalMeanCounter / num}
        Time to First Byte (ms) (Min, Max, Mean).....: ${timeToFirstByteValues.Min}, ${timeToFirstByteValues.Max}, ${timeToFirstByteMeanCounter / num}
        Time to Last Byte (ms) (Min, Max, Mean)......: ${timeToLastByteValues.Min}, ${timeToLastByteValues.Max}, ${timeToLastByteMeanCounter / num}
    `)
  }

  private async makeHttpRequest(url: string): Promise<NetworkResponse> {
    const startTime = Date.now()
    const req = await got.get(url)

    const { statusCode, timings } = req

    return {
      startTime,
      statusCode,
      timeToFirstByte: timings.start - startTime,
      timeToLastByte: timings.end ? timings.end - startTime : 0,
      totalTimeForRequest: timings.end ? timings.end - timings.start : 0,
    }
  }
}
