/* global artifacts:false, it:false, contract:false, assert:false */

const L7ProxyRegistry = artifacts.require('L7ProxyRegistry')
const L7TokenTransferProxy = artifacts.require('L7TokenTransferProxy')
const OwnableDelegateProxy = artifacts.require('OwnableDelegateProxy')
const TestToken = artifacts.require('TestToken')
const AuthenticatedProxy = artifacts.require('AuthenticatedProxy')
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:7545')
const web3 = new Web3(provider)

const BN = require('bignumber.js')

const increaseTime = (addSeconds, callback) => {
  return web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds],
    id: 0
  }, callback)
}

contract('L7TokenTransferProxy', (accounts) => {
  it('should not allow transfer from unauthenticated contract', () => {
    return L7TokenTransferProxy
      .deployed()
      .then(tokenTransferProxyInstance => {
        return TestToken
          .deployed()
          .then(tokenInstance => {
            return tokenTransferProxyInstance.transferFrom(tokenInstance.address, accounts[0], accounts[0], 0).then(() => {
              assert.equal(true, false, 'Transfer allowed from unauthenticated contract')
            }).catch(err => {
              assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert', 'Incorrect error')
            })
          })
      })
  })
})

contract('L7ProxyRegistry', (accounts) => {
  it('should not allow initial authentication twice', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.grantInitialAuthentication(accounts[0]).then(() => {
          assert.equal(true, false, 'Initial instant authentication allowed twice')
        }).catch(err => {
          assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert', 'Incorrect error')
        })
      })
  })

  it('should have a delegateproxyimpl', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.delegateProxyImplementation().then(ret => {
          assert.equal(ret.length, 42, 'Delegateproxyimpl was not set')
        })
      })
  })

  it('should allow proxy creation', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.registerProxy()
          .then(() => {
            return registryInstance.proxies(accounts[0])
              .then(ret => {
                assert.equal(ret.length, 42, 'Proxy was not created')
              })
          })
      })
  })

  it('should allow proxy update', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.upgradeTo(registryInstance.address).send({from: accounts[0]}).then(() => {
              return registryInstance.delegateProxyImplementation().then(impl => {
                return contract.methods.upgradeTo(impl).send({from: accounts[0]}).then(() => {
                })
              })
            })
          })
      })
  })

  it('should not allow proxy upgrade to same implementation', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            return registryInstance.delegateProxyImplementation().then(impl => {
              const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
              return contract.methods.upgradeTo(impl).send({from: accounts[0]}).then(() => {
                assert.equal(true, false, 'Allowed upgrade to same implementation')
              }).catch(err => {
                assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Proxy already uses this implementation')
              })
            })
          })
      })
  })

  it('should allow upgradeAndCall', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.upgradeTo(registryInstance.address).send({from: accounts[0]}).then(() => {
              return registryInstance.delegateProxyImplementation().then(impl => {
                const implContract = new web3.eth.Contract(AuthenticatedProxy.abi, ret)
                const bytecode = implContract.methods.setRevoke(true).encodeABI()
                return contract.methods.upgradeToAndCall(impl, bytecode).send({from: accounts[0]}).then(() => {
                  return implContract.methods.revoked().call().then(revoked => {
                    assert.equal(revoked, true, 'Revoked was not set')
                    return implContract.methods.setRevoke(false).send({from: accounts[0]}).then(() => {
                      return implContract.methods.revoked().call().then(revoked => {
                        assert.equal(revoked, false, 'Revoked was not set')
                      })
                    })
                  })
                })
              })
            })
          })
      })
  })

  it('should return proxy type', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.proxyType().call().then(ty => {
              assert.equal(ty, 2, 'Incorrect proxy type')
            })
          })
      })
  })

  it('should allow ownership transfer', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.transferProxyOwnership(accounts[1]).send({from: accounts[0]}).then(() => {
              return contract.methods.proxyOwner().call().then(owner => {
                assert.equal(owner.toLowerCase(), accounts[1].toLowerCase(), 'Incorrect owner')
                return contract.methods.transferProxyOwnership(accounts[0]).send({from: accounts[1]}).then(() => {
                  return contract.methods.transferProxyOwnership(accounts[1]).send({from: accounts[1]}).then(() => {
                    assert.equal(true, false, 'Allowed ownership transfer from another account')
                  }).catch(err => {
                    assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Only the proxy owner can call this method')
                  })
                })
              })
            })
          })
      })
  })

  it('should not allow proxy update from another account', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.upgradeTo(registryInstance.address).send({from: accounts[1]}).then(() => {
              assert.equal(true, false, 'allowed proxy update from another account')
            }).catch(err => {
              assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Only the proxy owner can call this method')
            })
          })
      })
  })

  it('should not allow proxy transfer to a nonexistent account', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(ret => {
            const contract = new web3.eth.Contract(OwnableDelegateProxy.abi, ret)
            return contract.methods.transferProxyOwnership('0x0000000000000000000000000000000000000000').send({from: accounts[0]}).then(() => {
              assert.equal(true, false, 'allowed proxy transfer to a nonexistent account')
            }).catch(err => {
              assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' New owner cannot be the null address')
            })
          })
      })
  })

  it('should not allow reinitialization', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(proxy => {
            const proxyInst = new web3.eth.Contract(AuthenticatedProxy.abi, proxy)
            return proxyInst.methods.initialize(accounts[1], registryInstance.address).send({from: accounts[0]}).then(() => {
              assert.equal(true, false, 'allowed proxy reinitialization')
            }).catch(err => {
              assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Authenticated proxy already initialized')
            })
          })
      })
  })

  it('should allow start but not end of authentication process', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.startGrantAuthentication(accounts[0]).then(() => {
          return registryInstance.pending.call(accounts[0]).then(r => {
            assert.equal(r.toNumber() > 0, true, 'Invalid timestamp')
            return registryInstance.endGrantAuthentication(accounts[0]).then(() => {
              assert.equal(true, false, 'End of authentication process allowed without time period passing')
            }).catch(err => {
              assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Contract is no longer pending or has already been approved by registry -- Reason given: Contract is no longer pending or has already been approved by registry.', 'Incorrect error')
            })
          })
        })
      })
  })

  it('should not allow start twice', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.startGrantAuthentication(accounts[0]).then(() => {
          assert.equal(true, false, 'Start of authentication process allowed twice')
        }).catch(err => {
          assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Contract is already allowed in registry, or pending -- Reason given: Contract is already allowed in registry, or pending.', 'Incorrect error')
        })
      })
  })

  it('should not allow end without start', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.endGrantAuthentication(accounts[1]).then(() => {
          assert.equal(true, false, 'End of authentication process allowed without start')
        }).catch(err => {
          assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Contract is no longer pending or has already been approved by registry -- Reason given: Contract is no longer pending or has already been approved by registry.', 'Incorrect error')
        })
      })
  })

  it('should allow end after time has passed', () => {
    return L7ProxyRegistry
     .deployed()
     .then(registryInstance => {
       return increaseTime(86400 * 7 * 3, () => {
         return registryInstance.endGrantAuthentication(accounts[0]).then(() => {
           return registryInstance.contracts.call(accounts[0]).then(ret => {
             assert.equal(ret, true, 'Auth was not granted')
             return registryInstance.revokeAuthentication(accounts[0]).then(() => {
               return registryInstance.contracts.call(accounts[0]).then(ret => {
                 assert.equal(ret, false, 'Auth was not revoked')
               })
             })
           })
         })
       })
     })
  })

  it('should not allow duplicate proxy creation', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.registerProxy()
          .then(() => {
            assert.equal(true, false, 'Duplicate registration was allowed')
          })
      }).catch(err => {
        assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' User already has a proxy -- Reason given: User already has a proxy.', 'Incorrect error')
      })
  })

  it('should allow sending tokens through proxy', () => {
    const amount = new BN(10).pow(25).multipliedBy(2)
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return TestToken
          .deployed()
          .then(tokenInstance => {
            return registryInstance.proxies(accounts[0])
              .then(proxy => {
                return tokenInstance.transfer(proxy, amount).then(() => {
                  const abi = new web3.eth.Contract(tokenInstance.abi, tokenInstance.address).methods.transfer(accounts[0], amount).encodeABI()
                  const proxyInst = new web3.eth.Contract(AuthenticatedProxy.abi, proxy)
                  return proxyInst.methods.proxyAssert(tokenInstance.address, 0, abi).send({from: accounts[0]}).then(() => {
                    return tokenInstance.balanceOf.call(accounts[0]).then(balance => {
                      assert.equal(balance.equals(amount), true, 'Tokens were not sent back from proxy')
                    })
                  })
                })
              })
          })
      })
  })

  it('should allow delegatecall', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0])
          .then(proxy => {
            const proxyInst = new web3.eth.Contract(AuthenticatedProxy.abi, proxy)
            const encoded = proxyInst.methods.proxyAssert(accounts[0], 0, '0x').encodeABI()
            return proxyInst.methods.proxyAssert(proxy, 1, encoded).send({from: accounts[0]})
          })
      })
  })

  it('should allow revoke', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0]).then(proxy => {
          const proxyInst = new web3.eth.Contract(AuthenticatedProxy.abi, proxy)
          return proxyInst.methods.setRevoke(true).send({from: accounts[0]}).then(txHash => {
            return proxyInst.methods.revoked().call().then(revoked => {
              assert.equal(revoked, true, 'Revoked was not set correctly')
            }).then(() => {
              return proxyInst.methods.setRevoke(false).send({from: accounts[0]}).then(() => {
                return proxyInst.methods.revoked().call().then(revoked => {
                  assert.equal(revoked, false, 'Revoked was not reset correctly')
                })
              })
            })
          })
        })
      })
  })

  it('should not allow revoke from another account', () => {
    return L7ProxyRegistry
      .deployed()
      .then(registryInstance => {
        return registryInstance.proxies(accounts[0]).then(proxy => {
          const proxyInst = new web3.eth.Contract(AuthenticatedProxy.abi, proxy)
          return proxyInst.methods.setRevoke(true).send({from: accounts[1]}).then(() => {
            assert.equal(true, false, 'Revocation was allowed from another account')
          }).catch(err => {
            assert.equal(err.message, 'Returned error: VM Exception while processing transaction: revert' + ' Authenticated proxy can only be revoked by its user', 'Incorrect error')
          })
        })
      })
  })
})
