export const ROLES = {

  HEAD_OFFICE: "Head Office",

  TEAM_LEADER: "Team Leader",

  FRANCHISE_PARTNER: "Franchise Partner"

};



export const ROLE_PASSWORDS = {

  [ROLES.HEAD_OFFICE]:
    "office2026",

  [ROLES.TEAM_LEADER]:
    "teamlead2026",

  [ROLES.FRANCHISE_PARTNER]:
    "franchise2026"

};



export const ROLE_SEGMENTS = {


  [ROLES.HEAD_OFFICE]: [

    "Year",
    "Team Leader",
    "BD Member",
    "Franchise",
    "Industry",
    "City",
    "Client Status"

  ],



  [ROLES.TEAM_LEADER]: [

    "Year",
    "BD Member",
    "Franchise",
    "Industry",
    "Client Status"

  ],



  [ROLES.FRANCHISE_PARTNER]: [

    "Year",
    "Industry",
    "Client Status"

  ]

};