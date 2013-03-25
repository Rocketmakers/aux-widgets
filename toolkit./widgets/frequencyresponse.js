var FrequencyResponse = new Class({
    Extends: Chart,
    options: {
        db_grid: 12,
        min_x:   20,
        max_x:   20000,
        min_y:   -36,
        max_y:   36,
        mode_x:  4,
        mode_y:  2
    },
    initialize: function (options) {
        this.setOptions(options);
        this.parent(options);
        this.element.addClass("toolkit-frequency-response");
        this.redraw();
    },
    
    redraw: function (graphs, grid) {
        this.options.grid_x = [
            {pos:    20, label: "20 Hz"},
            {pos:    30, label: "30"},
            {pos:    40, label: "40"},
            {pos:    50, label: "50"},
            {pos:    60, label: "60"},
            {pos:    70, label: "70"},
            {pos:    80},
            {pos:    90},
            {pos:   100, label: "100"},
            {pos:   200, label: "200"},
            {pos:   300, label: "300"},
            {pos:   400, label: "400"},
            {pos:   500, label: "500"},
            {pos:   600, label: "600"},
            {pos:   700, label: "700"},
            {pos:   800},
            {pos:   900},
            {pos:  1000, label: "1000"},
            {pos:  2000, label: "2000"},
            {pos:  3000, label: "3000"},
            {pos:  4000, label: "4000"},
            {pos:  5000, label: "5000"},
            {pos:  6000, label: "6000"},
            {pos:  7000, label: "7000"},
            {pos:  8000},
            {pos:  9000},
            {pos: 10000, label: "10000"},
            {pos: 20000, label: "20000 Hz"}
        ];
        this.options.grid_y = []
        for(var i = this.options.min_y; i <= this.options.max_y; i += this.options.db_grid) {
            var cls = "";
            if(i == ((this.options.max_y - this.options.min_y) / 2 + this.options.min_y)) {
                cls = "toolkit-highlight";
            }
            this.options.grid_y.push({
                pos:     i,
                label:   i == this.options.min_y ? "" : i + "dB",
                "class": cls
            });
        }
        this.__grid.set("grid_x", this.options.grid_x, true);
        this.__grid.set("grid_y", this.options.grid_y, true);
        this.parent(graphs, true);
    }
});
