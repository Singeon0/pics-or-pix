module.exports = {
  apps: [{
    name: "pics-or-pix",
    script: "index.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    watch: false,
    max_memory_restart: "200M",
    instance_var: "INSTANCE_ID",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/var/log/pics-or-pix/error.log",
    out_file: "/var/log/pics-or-pix/out.log",
    merge_logs: true,
    combine_logs: true,
    
    // Node.js optimizations
    node_args: "--max-old-space-size=200 --optimize-for-size --max-http-header-size=8192 --no-warnings",
    
    // Process management
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 5000,
    
    // Restart strategy
    autorestart: true,
    exp_backoff_restart_delay: 100,
    restart_delay: 1000,
    
    // Metrics
    trace: false,
    disable_trace: true
  }]
};