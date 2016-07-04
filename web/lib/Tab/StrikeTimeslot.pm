package Tab::StrikeTimeslot;
use base 'Tab::DBI';
Tab::StrikeTimeslot->table('strike_timeslot');
Tab::StrikeTimeslot->columns(Primary => qw/id/);
Tab::StrikeTimeslot->columns(Essential => qw/name fine start end category timestamp/);

Tab::StrikeTimeslot->has_a(category => 'Tab::Category');
Tab::StrikeTimeslot->has_many(strikes => 'Tab::Strike', "strike_timeslot");

__PACKAGE__->_register_datetimes( qw/start end/);

sub strike {

	my ($self, $judge) = @_;

	return unless $self;
	return unless $judge; 

	my @cons = Tab::Strike->search(	
		strike_timeslot => $self->id,
		judge           => $judge->id
	);

    my $con = shift @cons if @cons;
    foreach (@cons) {$_->delete;} #rm spares
	return $con;
}

