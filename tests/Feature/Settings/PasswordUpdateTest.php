<?php

use Illuminate\Support\Facades\Hash;

test('password update page is displayed', function () {
    $this->actingAsHotelUser();

    $response = $this->get(route('user-password.edit'));

    $response->assertOk();
});

test('password can be updated', function () {
    $user = $this->actingAsHotelUser();

    $response = $this
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-password.edit'));

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('correct password must be provided to update password', function () {
    $this->actingAsHotelUser();

    $response = $this
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('user-password.edit'));
});
