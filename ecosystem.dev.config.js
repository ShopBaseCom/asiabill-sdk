module.exports = {
  apps: [
    {
      'name': 'asiabill',
      'max_memory_restart': '1G',
      'instances': '1',
      'exec_mode': 'cluster',
      'script': 'yarn start',
      'node_args': '--max_old_space_size=1024',
      'log_date_format': 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
