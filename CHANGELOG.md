## Unreleased

### Feat

- add vanilla trpc client
- create rpc router with send and confirm procedure
- link webapp to smart contract
- add sol tx generation trpc routers
- add make and fulfill ixs for selfpromises
- add release promise functionality
- add promise drawer to promises view
- add new dashboard page
- add promises view component
- add getall and getone promise trpc routes
- add toast component to promise creator
- add solana program
- initialize planetscale and drizzle
- add wallet context providers
- add create promise page

### Fix

- fail program if not meeting minimum promise size
- remove ts expect error comments
- attempt to resolve publickey typeerror
- undo aysnc function component
- remove typeerror in fulfulldrawer
- remove publickey printing on console log
- generate fulfill tx on drawer open
- fix fulfill promise schema
- change toast order
- use vanilla trpc client for sendandconfirm
- add null case to sendandconfirm schema
- fetch make tx only when promise text is not empty
- only put promise on database once confirmed
- put make tx generation behind the server
- clean up wallet context
- use proper program id without regenerating
- use rpc on the client
- update other routers accordingly
- use rpc url env to create anchor connection
- ignore type for signer since query forces input to be undefined
- call make ix with usequery
- pass output of make ix trpc route as string
- use node crypto library for hasing input text
- add solana router to trpc
- use new anchor syntax
- ignore unsafe member access when importing program
- export types to own folder
- update idl referenced by webapp
- make tx messages more descriptive
- fail tx generation if fulfilling and breaking are not in correct times
- fail tx generation if promise deadline is not a future time
- assign promise text to u8 array type of length 8
- add promise skeleton
- await promise on mutatation cache
- invalidate query cache to refresh render on promise release
- modify dash styles
- change order of promises loaded
- remove dash route layout altogether
- link home page to promise dashboard
- remove redundant main component in app layout
- inform user of transaction and reset form
- remove post component
- insert promise details to db
- remove hydration error
- only accept phantom wallets
- ensure all numbers in time components are visible
- link date and time input to utc epoch time
- fix promiseform frontend state
- point trpc to database
- cleanup root layout and page import
- use wallet component in dApp
- silence everything but frontend page for now
- silence database calls for now

### Refactor

- move promise drawer to its own component
- remove accomplished todos
- add todo for caching latestblockhash rpc calls
- add todo for promise pda address here
- add todos for server client separation
