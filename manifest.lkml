
project_name: "my-project"

application: dashboard_filter_sets {
  url: "https://localhost:8080/bundle.js"
  label: "Dashboard Filter Sets"
  entitlements: {
    core_api_methods: ["update_artifacts","artifact","delete_artifact","artifact_value"]
  }
  mount_points: {
    dashboard_vis: no
    dashboard_tile: yes
    standalone: no
  }
}
