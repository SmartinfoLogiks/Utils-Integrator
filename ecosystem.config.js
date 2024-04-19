module.exports = {
  apps : [{
    name: 'SILK_Integrator',
    script: 'index.js',
    instances : '1',
    watch: ["plugins/*", "config.json"],
    max_memory_restart: '1024M',
    exec_mode : "cluster",
    env: {
        "NODE_ENV": "production"
    }
  }]
};
