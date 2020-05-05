'use strict';

const {
    Action,
    Event,
    Property,
    SingleThing,
    Thing,
    Value,
    WebThingServer,
} = require('webthing');
const { v4: uuidv4 } = require('uuid');



class AddUserAction extends Action {
    constructor(thing, input) {
        super(uuidv4(), thing, 'addUser', input);
    }

    performAction() {
        return new Promise((resolve) => {
            this.thing.AddUser(this.input);
            resolve();
        });
    }
}


class RemoveUserAction extends Action {
    constructor(thing, input) {
        super(uuidv4(), thing, 'removeUser', input);
    }

    performAction() {
        return new Promise((resolve) => {
            this.thing.RemoveUser(this.input.userId);
            resolve();
        });
    }
}


class SetPinCodeAction extends Action {
    constructor(thing, input) {
        super(uuidv4(), thing, 'setPinCode', input);
    }

    performAction() {
        return new Promise((resolve) => {
            this.thing.SetUserPinCode(this.input.userId, this.input.pin)
            resolve();
        });
    }
}


class SimDoorLock extends Thing {
    constructor() {
        super('urn:dev:SimDoorLock', 'Sim Door Lock', ['Lock'], 'A pin-entry lock.');

        // Keep the user information in our own array
        this.users = [];

        this.addProperty(new Property(this, "locked", new Value(true), {
            '@type': 'BooleanProperty',
            'label': 'Locked',
            'type': 'boolean'
        }));

        // Add a property called "users" which track the array of users
        // May want to hide the pin code in the future :-)
        this.addProperty(new Property(this, "users", new Value(this.users), {
            'label': 'Users',
            'type': 'array'
        }));

        this.addAvailableAction('addUser', {
            title: 'Add User',
            description: 'Add a user to a door lock.',
            input: {
                type: 'object',
                required: [
                    'userId',
                    'pin'
                ],
                properties: {
                    userName: {
                        title: 'User Name',
                        description: 'Name of the User',
                        type: 'string',
                    },
                    userId: {
                        title: 'User Id',
                        // eslint-disable-next-line max-len
                        description: 'User entry to set 0 - Max PinCode Users supported by the Lock',
                        type: 'integer',
                        minimum: 0,
                        maximum: 9
                    },
                    status: {
                        title: 'Status',
                        description: 'Enabled or Disabled',
                        enum: [
                            'Disabled',
                            'Enabled',
                        ],
                    },
                    pin: {
                        title: 'PIN Code',
                        description: 'Numerical PIN Code to set',
                        type: 'string',
                    },
                    startDate: {
                        title: 'Start Date/Time',
                        description: 'Start Date and Time for the schedule',
                        type: 'string',
                    },
                    endDate: {
                        title: 'Start Date/Time',
                        description: 'Start Date and Time for the schedule',
                        type: 'string',
                    },
                },
            },
        },
        AddUserAction);

        this.addAvailableAction('removeUser', {
            title: 'Remove User',
                description: 'Removes a user',
                input: {
                type: 'object',
                    properties: {
                    userId: {
                        title: 'User Id',
                        description: 'User entry to set',
                        type: 'integer',
                        minimum: 0,
                        maximum: 9,
                    }
                },
            },
        },
        RemoveUserAction);

        this.addAvailableAction('setPinCode', {
            title: 'Set User PIN Code',
            description: 'Set the PIN code for a specific user',
            input: {
                type: 'object',
                required: [
                    'userId',
                    'pin'
                ],
                properties: {
                    userId: {
                        title: 'User Id',
                        label: 'User Id',
                        description: 'User entry to set 1 - 31',
                        type: 'integer',
                        minimum: 0,
                        maximum: 9
                    },
                    pin: {
                        title: 'PIN Code',
                        label: 'PIN Code',
                        description: 'Numerical PIN Code to set',
                        type: 'string'
                    }
                }
            }
        },
        SetPinCodeAction);
    }


    AddUser(newUser) {
        console.log(newUser);
        let foundUser = this.users.findIndex((user) => {
            return (user.userId == newUser.userId);
        });

        if(foundUser === -1) {
            this.users.push(newUser);
        }
        else {
            this.UpdateUser(foundUser, newUser);
        }
    }


    UpdateUser(index, newUser) {
        this.users[index] = newUser;
    }


    RemoveUser(userId) {
        let foundUser = this.users.findIndex((user) => {
            return (user.userId == userId);
        });

        if(foundUser !== -1) {
            this.users.splice(foundUser, 1);
        }
    }


    SetUserPinCode(userId, newPin) {
        let foundUser = this.users.findIndex((user) => {
            return (user.userId == userId);
        });

        if(foundUser !== -1) {
            this.users[foundUser].pin = newPin;
        }
    }
}


function runServer() {
    const lock = new SimDoorLock();

    // If adding more than one thing, use MultipleThings() with a name.
    // In the single thing case, the thing's name will be broadcast.
    let things = new SingleThing(lock);
    const server = new WebThingServer(things, 8888);

    process.on('SIGINT', () => {
        server.stop().then(() => process.exit()).catch(() => process.exit());
    });

    server.start().catch(console.error);
}


runServer();
