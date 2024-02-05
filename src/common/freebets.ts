import { FreebetContractEntity } from "../../generated/src/Types.gen";

export function createFreebetContractEntity(
  chainId: string,
  freebetContractAddress: string,
  liquidityPoolAddress: string,
  freebetContractName: string | null,
  freebetContractAffiliate: string | null,
  freebetContractManager: string | null
): FreebetContractEntity {
  const freebetContractEntity: FreebetContractEntity = {
    id: freebetContractAddress + "-" + chainId,
    liquidityPool: liquidityPoolAddress,
    address: freebetContractAddress,
    name: freebetContractName ? freebetContractName : "",
    affiliate: freebetContractAffiliate ? freebetContractAffiliate : "",
    manager: freebetContractManager ? freebetContractManager : "",
  };

  return freebetContractEntity;
}
