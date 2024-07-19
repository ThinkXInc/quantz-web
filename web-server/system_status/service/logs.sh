# Start a new tmux session and set the initial pane title using escape sequences
tmux new-session -d -s systemStatusTasks -n '' \
'bash -c "printf \"\033]2;Check Congestion\033\\\\\"; exec journalctl -fu check_congestion.service --output cat"'

# Configure pane titles to be shown
tmux set -g pane-border-status bottom
tmux set -g pane-border-format "#{pane_index} #{pane_title}"

## Split the window horizontally (left and right) and set the title for the new right pane
#tmux select-pane -t 1
#tmux split-window -h 'bash -c "printf \"\033]2;\033\\\\\"; exec journalctl -fu process_chatdata.service --output cat"'
#tmux select-pane -t 2
##tmux send-keys 'printf "\033]2;LLM General Task\033\\"' C-m
#
#tmux select-pane -t 0
#tmux send-keys 'printf "\033]2;Handle LLM General Task Outputs\033\\"' C-m



# Optionally, set up even spacing and select the first pane for convenience
tmux select-layout even-horizontal
tmux select-pane -t 0

# Attach to the session
tmux attach-session -t systemStatusTasks