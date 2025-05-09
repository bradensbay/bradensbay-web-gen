const config = {
    ports: {
        authService: 3005,
        newUserService: 3006,
        userService: 3004,
        startVmService: 3001,
        updateKeyService: 3002,
        promptService: 3003,
        containerService: 3007,
    },
    endpoint: {
        containerService: '10.0.0.150'
    }
};

module.exports = config;