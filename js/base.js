;
(function () {
    'use strict';

    var $form_add_task = $('.add-task'),
        $body = $('body'),
        task_list = [],
        $delete_task_trigger, $detail_task_trigger, $task_detail = $('.task-detail'),
        $task_detail_mask = $('.task-detail-mask'),
        current_index, $update_form, $task_detail_content, $task_detail_content_input, $checkbox_complete_trigger, $alert = $('.alert');

    init();

    $form_add_task.on('submit', function (e) {
        var new_task = {},
            $input;
        /*禁用默认行为*/
        e.preventDefault();
        /*获取新Task的值*/
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        /*如果新Task为空直接返回，否则继续执行*/
        if (!new_task.content) return;
        /*存入新Task*/
        if (add_task(new_task)) {
            $input.val(null);
        }
    })

    function add_task(new_task) {
        /*添加新Task*/
        task_list.push(new_task);
        /*更新localstorage*/
        refresh_task_list();
        return true;
    }

    /*刷新数据并渲染*/
    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

    /*查找监听所有删除按钮的点击事件*/
    function listen_task_delete() {
        $delete_task_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            pop('确定要删除吗？').then(function (r) {
                r ? delete_task(index) : null;
            });
        })
    }

    function listen_checkbox_complete() {
        $checkbox_complete_trigger.on('click', function () {
            var index = $(this).parent().parent().data('index');
            var item = store.get('task_list')[index];
            if (item.complete) {
                update_task(index, {
                    complete: false
                });
            } else {
                update_task(index, {
                    complete: true
                });
            }
        })
    }

    function listen_task_detail() {
        $('.task-item').on('dblclick', function () {
            var $this = $(this);
            var index = $this.data('index');
            show_task_detail(index);
        });

        $detail_task_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            show_task_detail(index);
        })
    }

    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    /*渲染指定Task的详情*/
    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl =
            '<form>\n' +
            '            <!-- 任务标题  -->\n' +
            '            <div class="content">' + item.content + '</div>\n' +
            '            <div><!-- 任务描述  -->\n' +
            '<div><input style="display: none;" type="text" name="content" value="' + (item.content || []) + '"></div>' +
            '                <div class="desc">\n' +
            '                    <textarea name="desc" cols="30" rows="10">' + (item.desc || []) + '</textarea>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '            <div class="remind"><!-- 任务定时提醒  -->\n' +
            '<label>提醒时间:</label>' +
            '                <input class="datetime" type="text" name="remind_date" value="' + (item.remind_date || '') + '">\n' +
            '            </div>\n' +
            '<div>' +
            '    <button type="submit">更  新</button>\n' +
            '</div>' +
            '        </form>';

        $task_detail.html('');
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        $update_form = $task_detail.find('form');
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');
        $task_detail_content.on('dblclick', function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });
        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index, data);
            hide_task_detail();
        })
    }

    function update_task(index, data) {
        if (index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    $task_detail_mask.on('click', hide_task_detail);

    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    function delete_task(index) {
        if (index === undefined || !task_list[index]) return;
        delete task_list[index];
        /*更新localstorage*/
        refresh_task_list();
    }

    function task_remind_check() {
        var current_timestamp;
        var interval = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = store.get('task_list')[i];
                var task_timestamp;
                if (!item || !item.remind_date || item.informed) continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {
                        informed: true
                    });
                    show_msg(item.content);
                }
            }
        }, 500);
    }

    //到时提醒
    function show_msg(msg) {
        if (!msg) return;
        $('.msg').find('.msg-content').html(msg);
        $alert.get(0).play();
        $('.msg').show();
    }

    function listen_msg_event() {
        $('.msg').find('.confirmed').on('click', function () {
            hide_msg();
        })
    }

    function hide_msg() {
        $('.msg').hide();
    }

    function init() {
        task_list = store.get('task_list') || [];
        if (task_list.length) {
            render_task_list();
        }
        task_remind_check();
        listen_msg_event();
    }

    function pop(param) {
        if (!param) console.error('需要标题!');

        var conf = {},
            $box, $mask, $confirm, $cancel, dfd, confirmed;
        dfd = $.Deferred();

        if (typeof param == 'string') {
            conf.title = param;
        } else {
            conf = $.extend(conf, param);
        }

        $box = $('<div>' +
            '<div class="pop-title">' + conf.title + '</div>' +
            '<div class="pop-content">' +
            '<div><button style="margin-right: 5px;" class="primary confirm">确定</button><button class="cancel">取消</button></div>' +
            '</div>' +
            '</div>').css({
            color: '#444',
            width: 300,
            height: 'auto',
            padding: '15px 10px',
            background: '#fff',
            position: 'fixed',
            'border-radius': 3,
            'box-shadow': '0 1px 2px rgba(0,0,0,.5)'
        });

        var $title = $box.find('.pop-title').css({
            padding: '5px 10px',
            'font-weight': 900,
            'font-size': 20,
            'text-align': 'center'
        });

        var $content = $box.find('.pop-content').css({
            padding: '5px 10px',
            'text-align': 'center   '
        });

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');

        $mask = $('<div></div>').css({
            position: 'fixed',
            background: 'rgba(0,0,0,.5)',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        });

        var timer = setInterval(function () {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed);
                clearInterval(timer);
                hide_pop();
            }
        }, 50);

        $confirm.on('click', function () {
            confirmed = true;
        });

        $cancel.on('click', function () {
            confirmed = false;
        });

        $mask.on('click', function () {
            hide_pop();
        });

        function hide_pop() {
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position() {
            var win_width = $(window).width(),
                win_height = $(window).height(),
                box_width = $box.width(),
                box_height = $box.height(),
                move_x, move_y;

            move_x = (win_width - box_width) / 2;
            move_y = (win_height - box_height) / 2 - 20;
            $box.css({
                left: move_x,
                top: move_y,
            })
        }

        $(window).on('resize', function () {
            adjust_box_position();
        });

        $mask.appendTo($body);
        $box.appendTo($body);
        $(window).resize();
        return dfd.promise();
    }

    function render_task_list() {
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            if (item && (item.complete == true)) {
                complete_items[i] = item;
            } else {
                var $task = render_task_item(item, i);
            }
            $task_list.prepend($task);
        }

        for (var j = 0; j < complete_items.length; j++) {
            $task = render_task_item(complete_items[j], j);
            if (!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }

        $delete_task_trigger = $('.action.delete');
        $detail_task_trigger = $('.action.detail');
        $checkbox_complete_trigger = $('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    function render_task_item(data, index) {
        if (!data || index === undefined) return;
        var list_item_item =
            '<div class="task-item" data-index="' + index + '">  <!-- 任务开始  -->\n' +
            '            <span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>\n' +
            '            <span class="task-content">' + data.content + '</span>\n' +
            '<span class="fr">' +
            '            <span class="action delete">删除</span>\n' +
            '            <span class="action detail">详细</span>\n' +
            '</span>' +
            '        </div>';
        return $(list_item_item);
    }

})();