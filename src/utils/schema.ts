export function getEntityId(coreAddress: string, conditionId: string): string {
    return coreAddress.concat('_').concat(conditionId)
  }