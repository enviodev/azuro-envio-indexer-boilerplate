# Azuro Envio indexer boilerplate

This repo is to help the grantee build the opensource azuro indexer, it includes the configuration and events indexed from the [gnosis azuro v3 subgraph](https://github.com/Azuro-protocol/Azuro-subgraphs). Now deployed

### Additional resources

- [Azuro Subgraph v3](https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v3/graphql) for cross referencing the values


### Setup

#### Changes to generated code
This indexer requires some small changes to the generated code, the code that gets created when you run `pnpm envio codegen`:


1. `pnpm envio codegen` will build the generated code files
2. change the match event for NewGame from saying `LPv2` to `_`.And same for LPv3 new game

`/generated/srcTypes.res`:

![image](https://github.com/enviodev/azuro-envio-indexer-boilerplate/assets/74208897/76a7aa97-5233-4ac1-aad3-993fc5466f7e)

3. The next step is dealing with the decoding, previously it was trying to decode using the lpv2 abi but we need to explicitely tell it, if its after this block & its this address then we're going to explicitely tell it to use the LPv3 abi

`generated/src/ContractInterfaceManager.res`:


![image](https://github.com/enviodev/azuro-envio-indexer-boilerplate/assets/74208897/e26e0383-140e-479d-a7a9-2e8e903ea280)

```reason
let getAbiMapping = (self: t, ~fromBlock) => {
  self.contractAddressMapping.nameByAddress
  ->Js.Dict.entries
  ->Belt.Array.keepMap(((addr, name)) => {
    self.contractNameInterfaceMapping
    ->Js.Dict.get(name)
    ->Belt.Option.map(v => {
      let abi =
        addr == "0x204e7371Ade792c5C006fb52711c50a7efC843ed" && fromBlock > 29688365
          ? Abis.lPv3Abi->Ethers.makeAbi
          : v.abi
      (addr, abi)
    })
  })
  ->Js.Dict.fromArray
}
```

4.  Then lastly from hypersyncWorker.res we need to add the fromBlock
`->ContractInterfaceManager.getAbiMapping(~fromBlock)`

`generated/src/eventFetching/chainWorkers/HyperSyncWorker.res`:


![image](https://github.com/enviodev/azuro-envio-indexer-boilerplate/assets/74208897/03efce60-479b-4096-9c94-a05e8f8fac3a)


### Cached .db files

- *.db files on the repo are stored as LFS pointers (Github large file system), so you may need to run `git lfs pull` to restore the *.db files locally
