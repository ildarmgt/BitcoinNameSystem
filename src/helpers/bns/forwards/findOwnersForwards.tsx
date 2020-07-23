import { I_Forward, I_BnsState } from '../types'
import { getOwner } from './../formathelpers'
import { findLatestForwards } from './findLatestForwards'

/**
 * Returns array with only latest forwards from array of all forwards.
 * Removes actions, ones that start with "!" and ones that are blank addresses.
 */
export const findOwnersForwards = (
  st: any
): { length: number; toForwards: I_Forward[]; toSpaceSeparated: string[] } => {
  if (st === undefined || st === null) return nullResponse
  const owner = getOwner(st as I_BnsState)
  if (!owner || !owner.forwards) return nullResponse
  const forwards = findLatestForwards(owner.forwards)
  return {
    length: forwards.length,
    toForwards: forwards,
    toSpaceSeparated: forwards.map((fw: any) => `${fw.network} ${fw.address}`)
  }
}

// return this on fail
const nullResponse = {
  length: 0,
  toForwards: [] as I_Forward[],
  toSpaceSeparated: [] as string[]
}
