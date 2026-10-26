<?php

test('the home page sends visitors to the application form', function () {
    $this->get(route('home'))->assertRedirect(route('apply.create'));
});
