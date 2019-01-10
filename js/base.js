;
(function() {
	'use strict';

	var task_list = [],
		$form_add_task = $('.add-task')
		, $delete_trigger
		, $detail_trigger
		, $task_detail = $('.task-detail')
		, $update_form
		, $task_detail_content
		, $task_detail_content_input
		, $checkbox_trigger
		;

	init();

	function init() {
		task_list = store.get('task_list') || [];
		if(task_list.length) {
			render_task_list();
		}
		task_remind_check();
	}

	$form_add_task.on('submit', function(e) {
		e.preventDefault();
		var new_task = {},
			$input;
		$input = $(this).find('input[name=content]');
		new_task.content = $input.val();
		if(!new_task.content) return;
		if(add_task(new_task)) {
			$input.val('');
		}
	})

	function add_task(new_task) {
		if(!new_task) return;
		task_list.push(new_task);
		refresh_task_list();
		return true;
	}

	function refresh_task_list() {
		store.set('task_list', task_list);
		render_task_list();
	}

	function render_task_list() {
		var $task_list = $('.task-list');
		$task_list.html('');
		var completed_items = [];
		for(var i = 0; i < task_list.length; i++) {
			var item = task_list[i];
			if	(item && item.complete == true){
				completed_items[i] = item;
			}else{
				var $task_item;
				$task_item = render_task_item(item, i);
			}
			$task_list.prepend($task_item);
		}
		
		for(var j = 0; j < completed_items.length; j++){
			var item = render_task_item(completed_items[j], j);
			if(!item) continue;
			item.addClass('completed');
			$task_list.append(item)
		}

		$delete_trigger = $('.action.delete');
		listen_delete();
		$detail_trigger = $('.action.detail');
		listen_detail();
		$checkbox_trigger = $('.task-list .complete');
		listen_checkbox();
	}

	function render_task_item(data, index) {
		if(!data || index === undefined) return;
		var tpl = '<div class="task-item" data-index="' + index + '">' +
			'            <span><input class="complete" type="checkbox" ' + (data.complete ? 'checked' : '') + ' ></span>' +
			'            <span class="task-content">' + data.content + '</span>' +
			'            <span class="fr">' +
			'                <span class="action detail">详细</span>' +
			'                <span class="action delete">删除</span>' +
			'            </span>' +
			'        </div>';
		return $(tpl);
	}

	function listen_delete() {
		$delete_trigger.on('click', function() {
			var index = $(this).parent().parent().data('index');
			var r = confirm('确定删除吗？');
			if(r) delete_task(index);
		})
	}

	function delete_task(index) {
		if(index === undefined || !task_list[index]) return;
		delete task_list[index];
		refresh_task_list();
	}

	function listen_detail() {
		$detail_trigger.on('click', function() {
			var index = $(this).parent().parent().data('index');
			show_task_detail(index);
		})

		$('.task-item').on('dblclick', function() {
			var index = $(this).data('index');
			show_task_detail(index);
		})
	}

	function show_task_detail(index) {
		render_task_detail(index);
		$('.task-detail').show();
		$('.task-detail-mask').show();
	}

	function render_task_detail(index) {
		if(index === undefined) return;
		var item = task_list[index];
		var tpl = '<form>' +
			'            <!-- 任务标题  -->' +
			'            <div class="content">' + item.content + '</div>' +
			'            <div><!-- 任务描述  -->' +
			'<div><input style="display: none;" type="text" name="content" value="' + (item.content || []) + '"></div>' +
			'                <div class="desc">' +
			'                    <textarea name="desc" cols="30" rows="10">' + (item.desc || []) + '</textarea>' +
			'                </div>' +
			'            </div>' +
			'            <div class="remind"><!-- 任务定时提醒  -->' +
			'<label>提醒时间:</label>' +
			'                <input class="datetime" type="text" name="remind_date" value="' + (item.remind_date || '') + '">' +
			'            </div>' +
			'<div>' +
			'    <button type="submit">更  新</button>' +
			'</div>' +
			'        </form>';

		$task_detail.html('');
		$task_detail.html(tpl);
		$('.datetime').datetimepicker();
		$update_form = $task_detail.find('form');
		$task_detail_content = $update_form.find('.content');
		$task_detail_content_input = $update_form.find('[name=content]');
		$task_detail_content.on('dblclick', function() {
			$task_detail_content.hide();
			$task_detail_content_input.show();
		})
		$update_form.on('submit', function(e) {
			e.preventDefault();
			var data = {};
			data.content = $(this).find('[name=content]').val();
			data.desc = $(this).find('[name=desc]').val();
			data.remind_date = $(this).find('[name=remind_date]').val();
			update_task(index, data);
			hide_task_detail();
		})
	}

	$('.task-detail-mask').on('click', hide_task_detail);

	function hide_task_detail() {
		$('.task-detail').hide();
		$('.task-detail-mask').hide();
	}

	function update_task(index, data) {
		if(index === undefined || !data) return;
		task_list[index] = $.extend({}, task_list[index], data);
		refresh_task_list();
	}

	function listen_checkbox(){
		$checkbox_trigger.on('click', function(){
			var index = $(this).parent().parent().data('index');
			var item = store.get('task_list')[index];
			if	(item.complete){
				update_task(index ,{complete: false})
			}else{
				update_task(index, {complete: true})
			}
		})
	}
	
	function task_remind_check(){
		var current_timestamp;
		var interval = setInterval(function(){
			for	(var i = 0; i < task_list.length; i++){
				var item = store.get('task_list')[i];
				if (!item || item.informed == true || !item.remind_date) continue;
				var current_timestamp = (new Date()).getTime();
				var task_timestamp = (new Date(item.remind_date)).getTime();
				if	(current_timestamp - task_timestamp >= -1){
					update_task(i, {informed:true})	
					show_msg(item.content)
				}
			}
		},500)
	}
	
	function show_msg(msg){
		if(!msg) return;
		$('.msg').find('.msg-content').html(msg);
		$('.msg').show();
		console.log('s',1)
	}
})();