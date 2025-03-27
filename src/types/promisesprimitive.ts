/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/promisesprimitive.json`.
 */
export type Promisesprimitive = {
  "address": "8sL8SYGgy7JPbzQzA2MXtZzuHvgG4j84CeuV9Rxd42jb",
  "metadata": {
    "name": "promisesprimitive",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "breakSelfPromise",
      "discriminator": [
        224,
        119,
        199,
        95,
        132,
        224,
        192,
        11
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true,
          "address": "fTcVudr5vjBanSe9eYuX9HS3DuzjWKwavYBMbhLn2SJ"
        },
        {
          "name": "creator",
          "writable": true
        },
        {
          "name": "promiseAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  102,
                  112,
                  114,
                  111,
                  109,
                  105,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "text"
              },
              {
                "kind": "arg",
                "path": "deadlineSecs"
              },
              {
                "kind": "arg",
                "path": "size"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "text",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        },
        {
          "name": "deadlineSecs",
          "type": "u64"
        },
        {
          "name": "size",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fulfillSelfPromise",
      "discriminator": [
        191,
        163,
        223,
        59,
        105,
        132,
        4,
        68
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "promiseAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  102,
                  112,
                  114,
                  111,
                  109,
                  105,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "arg",
                "path": "text"
              },
              {
                "kind": "arg",
                "path": "deadlineSecs"
              },
              {
                "kind": "arg",
                "path": "size"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "text",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        },
        {
          "name": "deadlineSecs",
          "type": "u64"
        },
        {
          "name": "size",
          "type": "u64"
        }
      ]
    },
    {
      "name": "makeSelfPromise",
      "discriminator": [
        227,
        242,
        222,
        79,
        107,
        195,
        155,
        186
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "promiseAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  102,
                  112,
                  114,
                  111,
                  109,
                  105,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "arg",
                "path": "text"
              },
              {
                "kind": "arg",
                "path": "deadlineSecs"
              },
              {
                "kind": "arg",
                "path": "size"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "address": "fTcVudr5vjBanSe9eYuX9HS3DuzjWKwavYBMbhLn2SJ"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "text",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        },
        {
          "name": "deadlineSecs",
          "type": "u64"
        },
        {
          "name": "size",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "selfPromise",
      "discriminator": [
        38,
        216,
        45,
        6,
        30,
        217,
        59,
        132
      ]
    }
  ],
  "types": [
    {
      "name": "selfPromise",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "text",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "unixSeconds",
            "type": "u64"
          },
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
